
import json
import re
import base64
import logging
from pathlib import Path
from typing import Any, Dict, Optional

from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)


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
    except Exception as e:
    return None


class AIService:
    
    def __init__(self):
        self.api_key = settings.openai_api_key
        self.model = getattr(settings, "openai_model", "gpt-4o-mini")
        self.timeout = getattr(settings, "openai_timeout", 30)
    
    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)
    
    async def _call_openai(
        self,
        system_prompt: str,
        user_content: Any,
        max_tokens: int = 256,
        temperature: float = 0.1
    ) -> Optional[str]:
        if not self.is_configured:
            return None
        
        try:
            async with AsyncOpenAI(
                api_key=self.api_key,
                timeout=self.timeout
            ) as client:
                response = await client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
            
            if response.choices and len(response.choices) > 0:
                return response.choices[0].message.content
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
            
            user_prompt = (
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
                user_prompt += f"\n\nHint: the dish might be '{meal_name_hint}'"
            
            user_content = [
                {"type": "text", "text": user_prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{b64_image}",
                        "detail": "high"
                    },
                }
            ]
            
            async with AsyncOpenAI(
                api_key=self.api_key,
                timeout=self.timeout
            ) as client:
                response = await client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    max_tokens=256,
                    temperature=0.1,
                )
            
            if not response.choices:
                return None
                
            generated_text = response.choices[0].message.content
            
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
        """Анализирует данные продукта по штрихкоду."""
        if not self.is_configured:
            return None
        
        try:
            nutriments = product_data.get("nutriments", {})
            product_name = (
                product_data.get("product_name") or 
                product_data.get("generic_name") or 
                "Продукт"
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
            
            response_text = await self._call_openai(system_prompt, user_prompt)
            if not response_text:
                return None
            
            logger.info(f"OpenAI barcode analysis: {response_text}")
            
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
            logger.error(f"Barcode analysis failed: {e}")
            return None

    async def correct_meal(
        self,
        current_data: Dict[str, Any],
        correction_text: str
    ) -> Optional[Dict[str, Any]]:
        """Корректирует данные блюда на основе запроса пользователя."""
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
            
            response_text = await self._call_openai(
                system_prompt, 
                user_prompt, 
                max_tokens=512,
                temperature=0.2
            )
            
            if not response_text:
                return None
            
            logger.info(f"OpenAI correction response: {response_text}")
            
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
            logger.error(f"Meal correction failed: {e}")
            return None


# Синглтон для использования во всём приложении
ai_service = AIService()

