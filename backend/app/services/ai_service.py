
import json
import re
import base64
from pathlib import Path
from typing import Any, Dict, Optional

from anthropic import AsyncAnthropic
from app.core.config import settings


def _parse_number(val: Any) -> Optional[int]:
    try:
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return int(val)
        if isinstance(val, str):
            digits = "".join(ch for ch in val if ch.isdigit() or ch in ".,-")
            return int(float(digits)) if digits else None
    except (ValueError, TypeError):
        return None
    return None


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None
    try:
        matches = re.findall(r"\{.*\}", text, flags=re.DOTALL)
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue
    except Exception:
        pass
    return None


class AIService:
    
    def __init__(self):
        self.api_key = settings.anthropic_api_key
        self.model = getattr(settings, "anthropic_model", "claude-3-5-sonnet-20241022")
        self.timeout = getattr(settings, "anthropic_timeout", 30)
    
    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)
    
    async def _call_claude(
        self,
        system_prompt: str,
        user_content: Any,
        max_tokens: int = 256,
        temperature: float = 0.1
    ) -> Optional[str]:
        if not self.is_configured:
            return None
        
        try:
            async with AsyncAnthropic(
                api_key=self.api_key,
                timeout=self.timeout
            ) as client:
                # If user_content is a list (for vision), handle it directly
                if isinstance(user_content, list):
                    message = await client.messages.create(
                        model=self.model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        system=system_prompt,
                        messages=[{"role": "user", "content": user_content}]
                    )
                else:
                    # Simple text content
                    message = await client.messages.create(
                        model=self.model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        system=system_prompt,
                        messages=[{"role": "user", "content": user_content}]
                    )
            
            if message.content and len(message.content) > 0:
                return message.content[0].text
            return None
            
        except Exception as e:
            return None

    async def analyze_meal_photo(
        self,
        file_path: Path,
        meal_name_hint: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None
        
        try:
            mime_types = {
                ".png": "image/png",
                ".webp": "image/webp",
                ".heic": "image/heic",
                ".heif": "image/heic",
            }
            suffix = file_path.suffix.lower()
            mime_type = mime_types.get(suffix, "image/jpeg")
            
            with open(file_path, "rb") as f:
                b64_image = base64.b64encode(f.read()).decode("utf-8")
            
            system_prompt = (
                "You are an expert nutrition assistant. Analyze food photos and estimate nutritional values accurately. "
                "Always respond with valid JSON only, no additional text or markdown."
            )
            
            user_prompt_text = (
                "Analyze this food photo and estimate the complete nutritional content. "
                "Respond ONLY with a JSON object in this exact format:\n"
                '{"name": "dish name in Russian", "calories": number, "protein": number, "fat": number, '
                '"carbs": number, "fiber": number, "sugar": number, "sodium": number, "health_score": number}\n'
                "Rules:\n"
                "- Use integers only, no decimal points\n"
                "- Values should be per portion shown in the photo\n"
                "- calories in kcal, protein/fat/carbs/fiber/sugar in grams, sodium in mg\n"
                "- health_score: 0-3 unhealthy, 4-6 moderate, 7-10 healthy\n"
                "- name in Russian language\n"
                "- If uncertain, use 0"
            )
            
            if meal_name_hint:
                user_prompt_text += f"\n\nHint: the dish might be '{meal_name_hint}'"
            
            user_content = [
                {"type": "text", "text": user_prompt_text},
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": b64_image,
                    }
                }
            ]
            
            generated_text = await self._call_claude(
                system_prompt,
                user_content,
                max_tokens=512,
                temperature=0.1
            )
            
            if not generated_text:
                return None
            
            extracted = _extract_json(generated_text)
            if not extracted:
                return None
            
            return {
                "calories": _parse_number(extracted.get("calories")),
                "protein": _parse_number(extracted.get("protein")),
                "fat": _parse_number(extracted.get("fat")),
                "carbs": _parse_number(extracted.get("carbs")),
                "fiber": _parse_number(extracted.get("fiber")),
                "sugar": _parse_number(extracted.get("sugar")),
                "sodium": _parse_number(extracted.get("sodium")),
                "health_score": _parse_number(extracted.get("health_score")),
                "detected_meal_name": extracted.get("name") or meal_name_hint,
            }
            
        except Exception as e:
            return None

    async def analyze_barcode_product(
        self,
        product_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None
        
        try:
            nutriments = product_data.get("nutriments", {})
            product_name = (
                product_data.get("product_name") or 
                product_data.get("generic_name") or 
                "Product"
            )
            
            system_prompt = (
                "You are an expert nutritionist. Analyze food product data and estimate missing nutritional values. "
                "Always respond with valid JSON only."
            )
            
            user_prompt = (
                f"Analyze this food product and estimate nutritional content per 100g:\n"
                f"Product: {product_name}\n"
                f"Nutriments: {json.dumps(nutriments)}\n\n"
                "Respond with JSON: "
                '{"fiber": int, "sugar": int, "sodium": int, "health_score": int}\n'
                "fiber/sugar in grams, sodium in mg, health_score 0-10"
            )
            
            response_text = await self._call_claude(system_prompt, user_prompt)
            if not response_text:
                return None
            
            
            extracted = _extract_json(response_text)
            if not extracted:
                return None
            
            return {
                "fiber": _parse_number(extracted.get("fiber")),
                "sugar": _parse_number(extracted.get("sugar")),
                "sodium": _parse_number(extracted.get("sodium")),
                "health_score": _parse_number(extracted.get("health_score")),
            }
            
        except Exception as e:
            return None

    async def correct_meal(
        self,
        current_data: Dict[str, Any],
        correction_text: str
    ) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None
        
        try:
            system_prompt = (
                "You are an expert nutrition assistant. User wants to correct a meal's nutritional information. "
                "Analyze their request and provide corrected values. Respond with valid JSON only."
            )
            
            user_prompt = (
                f"Current meal data: {json.dumps(current_data, ensure_ascii=False)}\n\n"
                f"User's correction: {correction_text}\n\n"
                "Provide corrected data in JSON format:\n"
                '{"name": "...", "calories": int, "protein": int, "fat": int, "carbs": int, '
                '"fiber": int, "sugar": int, "sodium": int, "health_score": int, '
                '"ingredients": [{"name": "...", "calories": int}]}\n'
                "Only change values mentioned by user. Name in Russian."
            )
            
            response_text = await self._call_claude(
                system_prompt, 
                user_prompt, 
                max_tokens=512,
                temperature=0.2
            )
            
            if not response_text:
                return None
            
            
            extracted = _extract_json(response_text)
            if not extracted:
                return None
            
            return {
                "name": extracted.get("name"),
                "calories": _parse_number(extracted.get("calories")),
                "protein": _parse_number(extracted.get("protein")),
                "fat": _parse_number(extracted.get("fat")),
                "carbs": _parse_number(extracted.get("carbs")),
                "fiber": _parse_number(extracted.get("fiber")),
                "sugar": _parse_number(extracted.get("sugar")),
                "sodium": _parse_number(extracted.get("sodium")),
                "health_score": _parse_number(extracted.get("health_score")),
                "ingredients": extracted.get("ingredients", []),
            }
            
        except Exception as e:
            return None

    async def generate_recipe(
        self,
        user_request: str
    ) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            return None
        
        try:
            system_prompt = (
                "You are an expert nutritionist and chef. Generate healthy, balanced recipes based on user's request. "
                "Always respond with valid JSON only, no additional text or markdown."
            )
            
            user_prompt = (
                f"User request: {user_request}\n\n"
                "Based on the user's request, create a recipe. Determine the meal type (завтрак/обед/ужин/перекус) automatically. "
                "Respond with JSON in this exact format:\n"
                '{"name": "recipe name in Russian", "description": "brief description in Russian", '
                '"meal_type": "завтрак" | "обед" | "ужин" | "перекус", '
                '"calories": int, "protein": int, "fat": int, "carbs": int, '
                '"fiber": int, "sugar": int, "sodium": int, "health_score": float (0.0-10.0), '
                '"time": int, "difficulty": "Легко" | "Средне" | "Сложно", '
                '"ingredients": ["ingredient1 in Russian", "ingredient2", ...], '
                '"instructions": ["step1 in Russian", "step2", ...]}\n'
                "Rules:\n"
                "- All values per serving\n"
                "- calories in kcal, protein/fat/carbs/fiber/sugar in grams, sodium in mg\n"
                "- health_score: 0.0-10.0 based on nutritional value (higher is healthier, use 1 decimal place)\n"
                "- time in minutes\n"
                "- difficulty: Легко (up to 20 min), Средне (20-40 min), Сложно (40+ min)\n"
                "- All text in Russian\n"
                "- If user specifies calorie target, try to match it\n"
                "- If user lists ingredients, use them in the recipe\n"
                "- Make it healthy and balanced"
            )
            
            response_text = await self._call_claude(
                system_prompt,
                user_prompt,
                max_tokens=1024,
                temperature=0.7
            )
            
            if not response_text:
                return None
            
            extracted = _extract_json(response_text)
            if not extracted:
                return None
            
            return {
                "name": extracted.get("name", "Recipe"),
                "description": extracted.get("description", ""),
                "meal_type": extracted.get("meal_type", "snack"),
                "calories": _parse_number(extracted.get("calories")),
                "protein": _parse_number(extracted.get("protein")),
                "fat": _parse_number(extracted.get("fat")),
                "carbs": _parse_number(extracted.get("carbs")),
                "fiber": _parse_number(extracted.get("fiber")),
                "sugar": _parse_number(extracted.get("sugar")),
                "sodium": _parse_number(extracted.get("sodium")),
                "health_score": _parse_number(extracted.get("health_score")),
                "time": _parse_number(extracted.get("time")),
                "difficulty": extracted.get("difficulty", "Easy"),
                "ingredients": extracted.get("ingredients", []),
                "instructions": extracted.get("instructions", []),
            }
            
        except Exception as e:
            return None


ai_service = AIService()

