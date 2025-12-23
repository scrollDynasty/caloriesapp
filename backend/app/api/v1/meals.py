import uuid
import logging
import json
import base64
import re
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status, Query, Header, Body
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.meal_photo import MealPhoto
from app.schemas.meal_photo import MealPhotoUploadResponse, MealPhotoResponse, MealPhotoCreate
from app.schemas.water import WaterCreate, WaterDailyResponse, WaterEntry
from app.models.water_log import WaterLog
from app.models.onboarding_data import OnboardingData
from app.core.database import get_db
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

_BACKEND_DIR = Path(__file__).parent.parent.parent.parent
_PROJECT_ROOT = _BACKEND_DIR.parent
MEDIA_ROOT = _PROJECT_ROOT / "media" / "meal_photos"

try:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    logger.info(f"Media directory initialized at: {MEDIA_ROOT}")
except Exception as e:
    logger.error(f"Failed to create media directory at {MEDIA_ROOT}: {e}")
    raise

def get_user_media_dir(user_id: int) -> Path:
    user_dir = MEDIA_ROOT / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir

async def get_nutrition_insights(file_path: Path, meal_name_hint: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Анализирует фото еды с помощью OpenAI GPT-4o Vision и возвращает информацию о питательности.
    """
    from openai import AsyncOpenAI

    api_key = settings.openai_api_key
    if not api_key:
        logger.warning("OpenAI API key not configured")
        return None

    model_name = getattr(settings, "openai_model", "gpt-4o")

    try:
        # Определяем MIME тип изображения
        mime_guess = "image/jpeg"
        suffix = file_path.suffix.lower()
        if suffix in {".png"}:
            mime_guess = "image/png"
        elif suffix in {".webp"}:
            mime_guess = "image/webp"
        elif suffix in {".heic", ".heif"}:
            mime_guess = "image/heic"

        # Читаем и кодируем изображение в base64
        with open(file_path, "rb") as f:
            b64_image = base64.b64encode(f.read()).decode("utf-8")

        # Формируем промпт для GPT-4o
        system_prompt = (
            "You are an expert nutrition assistant. Analyze food photos and estimate nutritional values accurately. "
            "Always respond with valid JSON only, no additional text or markdown."
        )
        
        user_prompt = (
            "Analyze this food photo and estimate the complete nutritional content. "
            "Respond ONLY with a JSON object in this exact format:\n"
            '{"name": "dish name in Russian", "calories": number, "protein": number, "fat": number, "carbs": number, "fiber": number, "sugar": number, "sodium": number}\n'
            "Rules:\n"
            "- Use integers only, no decimal points\n"
            "- Values should be per portion shown in the photo\n"
            "- calories in kcal\n"
            "- protein, fat, carbs, fiber, sugar in grams\n"
            "- sodium in milligrams (mg)\n"
            "- name should be in Russian language\n"
            "- If you cannot estimate a value, use 0"
        )
        if meal_name_hint:
            user_prompt = f"{user_prompt}\n\nHint: the dish might be '{meal_name_hint}'"

        async with AsyncOpenAI(
            api_key=api_key,
            timeout=settings.openai_timeout
        ) as client:
            response = await client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_guess};base64,{b64_image}",
                                    "detail": "high"
                                },
                            }
                        ],
                    }
                ],
                max_tokens=256,
                temperature=0.1,
            )

        # Извлекаем ответ
        generated_text = None
        if response.choices and len(response.choices) > 0:
            generated_text = response.choices[0].message.content

        if not generated_text:
            logger.warning("OpenAI returned empty response")
            return None

        logger.info(f"OpenAI response: {generated_text}")

        # Парсим JSON из ответа
        extracted = None
        try:
            # Пытаемся найти JSON в ответе
            matches = re.findall(r"\{.*\}", generated_text, flags=re.DOTALL)
            for m in matches:
                try:
                    extracted = json.loads(m)
                    break
                except Exception:
                    continue
        except Exception:
            extracted = None

        if extracted:
            def _num(val: Any) -> Optional[int]:
                try:
                    if val is None:
                        return None
                    if isinstance(val, (int, float)):
                        return int(val)
                    if isinstance(val, str):
                        digits = "".join(ch for ch in val if (ch.isdigit() or ch == "." or ch == "-"))
                        return int(float(digits)) if digits else None
                except Exception:
                    return None
                return None

            return {
                "calories": _num(extracted.get("calories")),
                "protein": _num(extracted.get("protein")),
                "fat": _num(extracted.get("fat")),
                "carbs": _num(extracted.get("carbs")),
                "fiber": _num(extracted.get("fiber")),
                "sugar": _num(extracted.get("sugar")),
                "sodium": _num(extracted.get("sodium")),
                "detected_meal_name": extracted.get("name") or meal_name_hint,
            }

        return None
    except Exception as e:
        logger.warning(f"OpenAI nutrition call failed: {e}")
        return None

@router.post("/meals/upload", response_model=MealPhotoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_meal_photo(
    file: UploadFile = File(...),
    barcode: str = Form(default=""),
    meal_name: str = Form(default=""),
    client_timestamp: Optional[str] = Form(default=None),
    client_tz_offset_minutes: Optional[int] = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logger.info(f"Upload request from user {current_user.id}, filename: {file.filename}")

    allowed_mime_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
    }
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть изображением"
        )
    if file.content_type not in allowed_mime_types:
        logger.warning(f"Unexpected mime type {file.content_type}, proceeding but ensure client sends correct type")

    barcode_value = barcode.strip() if barcode and barcode.strip() else None
    meal_name_value = meal_name.strip() if meal_name and meal_name.strip() else None

    file_ext = Path(file.filename or "photo").suffix or ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    user_dir = get_user_media_dir(current_user.id)
    file_path = user_dir / unique_filename

    try:
        contents = await file.read()
        file_size = len(contents)
        
        # Явно закрываем UploadFile для освобождения ресурсов
        await file.close()

        user_dir.mkdir(parents=True, exist_ok=True)

        with open(file_path, "wb") as f:
            f.write(contents)

        relative_path = f"meal_photos/{current_user.id}/{unique_filename}"

        if client_timestamp and client_tz_offset_minutes is not None:
            try:
                ts_str = client_timestamp.replace('Z', '+00:00') if client_timestamp.endswith('Z') else client_timestamp
                if '+' not in ts_str and '-' not in ts_str[-6:]:
                    tz_offset = timedelta(minutes=client_tz_offset_minutes)
                    client_dt = datetime.fromisoformat(ts_str).replace(tzinfo=timezone(tz_offset))
                else:
                    client_dt = datetime.fromisoformat(ts_str)
                    if client_dt.tzinfo is None:
                        tz_offset = timedelta(minutes=client_tz_offset_minutes)
                        client_dt = client_dt.replace(tzinfo=timezone(tz_offset))
                created_at_now = client_dt.astimezone(timezone.utc)
            except (ValueError, AttributeError) as e:
                created_at_now = datetime.now(timezone.utc)
        else:
            created_at_now = datetime.now(timezone.utc)

        nutrition = await get_nutrition_insights(
            file_path=file_path,
            meal_name_hint=meal_name_value,
        )


        meal_photo = MealPhoto(
            user_id=current_user.id,
            file_path=relative_path,
            file_name=file.filename or unique_filename,
            file_size=file_size,
            mime_type=file.content_type,
            barcode=barcode_value,
            meal_name=meal_name_value,
            detected_meal_name=nutrition.get("detected_meal_name") if nutrition else None,
            calories=nutrition.get("calories") if nutrition else None,
            protein=nutrition.get("protein") if nutrition else None,
            fat=nutrition.get("fat") if nutrition else None,
            carbs=nutrition.get("carbs") if nutrition else None,
            fiber=nutrition.get("fiber") if nutrition else None,
            sugar=nutrition.get("sugar") if nutrition else None,
            sodium=nutrition.get("sodium") if nutrition else None,
            created_at=created_at_now,
        )

        db.add(meal_photo)
        db.commit()
        db.refresh(meal_photo)


        photo_url = f"{settings.api_domain}/api/v1/meals/photos/{meal_photo.id}"

        return MealPhotoUploadResponse(
            photo=MealPhotoResponse.model_validate(meal_photo),
            url=photo_url,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading photo: {str(e)}", exc_info=True)

        if file_path.exists():
            try:
                file_path.unlink()
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при сохранении файла: {str(e)}"
        )

@router.get("/meals/photos", response_model=List[MealPhotoResponse])
def get_user_meal_photos(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photos = db.query(MealPhoto)\
        .filter(MealPhoto.user_id == current_user.id)\
        .order_by(MealPhoto.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

    return photos

@router.post("/meals/manual", response_model=MealPhotoResponse, status_code=status.HTTP_201_CREATED)
def create_manual_meal(
    payload: MealPhotoCreate = Body(...),
    client_timestamp: Optional[str] = Query(default=None),
    client_tz_offset_minutes: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone, timedelta

    if not payload.meal_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="meal_name is required",
        )
    
    if client_timestamp and client_tz_offset_minutes is not None:
        try:
            ts_str = client_timestamp.replace('Z', '+00:00') if client_timestamp.endswith('Z') else client_timestamp
            if '+' not in ts_str and '-' not in ts_str[-6:]:
                tz_offset = timedelta(minutes=client_tz_offset_minutes)
                client_dt = datetime.fromisoformat(ts_str).replace(tzinfo=timezone(tz_offset))
            else:
                client_dt = datetime.fromisoformat(ts_str)
                if client_dt.tzinfo is None:
                    tz_offset = timedelta(minutes=client_tz_offset_minutes)
                    client_dt = client_dt.replace(tzinfo=timezone(tz_offset))
            created_at = client_dt.astimezone(timezone.utc)
        except (ValueError, AttributeError) as e:
            created_at = datetime.now(timezone.utc)
    elif payload.created_at:
        try:
            ts_str = payload.created_at.replace('Z', '+00:00') if payload.created_at.endswith('Z') else payload.created_at
            created_at = datetime.fromisoformat(ts_str)
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError) as e:
            created_at = datetime.now(timezone.utc)
    else:
        created_at = datetime.now(timezone.utc)

    meal_photo = MealPhoto(
        user_id=current_user.id,
        file_path="manual",
        file_name="manual",
        file_size=0,
        mime_type="manual",
        meal_name=payload.meal_name,
        detected_meal_name=payload.meal_name,
        calories=payload.calories,
        protein=payload.protein,
        fat=payload.fat,
        carbs=payload.carbs,
        created_at=created_at,
    )

    db.add(meal_photo)
    db.commit()
    db.refresh(meal_photo)
    return meal_photo

@router.get("/meals/photos/{photo_id}", response_class=FileResponse)
def get_meal_photo(
    photo_id: int,
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):

    current_user: Optional[User] = None
    if authorization:
        try:

            scheme, _, cred = authorization.partition(" ")
            if scheme.lower() == "bearer" and cred:
                from app.utils.auth import verify_token, get_user_by_id
                payload = verify_token(cred)
                if payload and payload.get("sub"):
                    user = get_user_by_id(db, int(payload.get("sub")))
                    if user:
                        current_user = user
        except Exception:
            current_user = None

    if current_user is None and token:
        from app.utils.auth import verify_token, get_user_by_id
        payload = verify_token(token)
        if payload and payload.get("sub"):
            user = get_user_by_id(db, int(payload.get("sub")))
            if user:
                current_user = user

    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    photo = db.query(MealPhoto).filter(
        MealPhoto.id == photo_id,
        MealPhoto.user_id == current_user.id
    ).first()

    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Фотография не найдена"
        )

    if photo.mime_type == "manual" or photo.file_path in (None, "", "manual"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл отсутствует для ручной записи"
        )

    full_path = MEDIA_ROOT.parent / photo.file_path

    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден"
        )

    return FileResponse(
        path=str(full_path),
        media_type=photo.mime_type,
        filename=photo.file_name,
    )

@router.get("/meals/photos/{photo_id}/detail")
def get_meal_photo_detail(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить детальную информацию о блюде"""
    photo = db.query(MealPhoto).filter(
        MealPhoto.id == photo_id,
        MealPhoto.user_id == current_user.id
    ).first()

    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Фотография не найдена"
        )

    # Формируем URL изображения
    photo_url = None
    if photo.mime_type != "manual" and photo.file_path not in (None, "", "manual"):
        photo_url = f"{settings.api_domain}/api/v1/meals/photos/{photo.id}"

    return {
        "photo": {
            "id": photo.id,
            "user_id": photo.user_id,
            "file_path": photo.file_path,
            "file_name": photo.file_name,
            "file_size": photo.file_size,
            "mime_type": photo.mime_type,
            "barcode": photo.barcode,
            "meal_name": photo.meal_name,
            "detected_meal_name": photo.detected_meal_name,
            "calories": photo.calories,
            "protein": photo.protein,
            "fat": photo.fat,
            "carbs": photo.carbs,
            "created_at": photo.created_at.isoformat() if photo.created_at else None,
            "updated_at": photo.updated_at.isoformat() if photo.updated_at else None,
        },
        "url": photo_url,
        # Заглушки для будущих фич
        "ingredients": None,
        "extra_macros": None,
        "health_score": None,
    }

@router.put("/meals/photos/{photo_id}/confirm", response_model=MealPhotoResponse)
def confirm_meal_photo(
    photo_id: int,
    meal_name: str = Form(None),
    calories: int = Form(None),
    protein: int = Form(None),
    fat: int = Form(None),
    carbs: int = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = db.query(MealPhoto).filter(
        MealPhoto.id == photo_id,
        MealPhoto.user_id == current_user.id
    ).first()

    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Фотография не найдена"
        )

    if meal_name is not None:
        photo.meal_name = meal_name
    if calories is not None:
        photo.calories = calories
    if protein is not None:
        photo.protein = protein
    if fat is not None:
        photo.fat = fat
    if carbs is not None:
        photo.carbs = carbs

    db.commit()
    db.refresh(photo)

    return photo

@router.get("/meals/daily")
def get_daily_meals(
    date: str = Query(..., description="Дата в формате YYYY-MM-DD"),
    tz_offset_minutes: int = Query(0, description="Смещение клиента в минутах от UTC (getTimezoneOffset * -1)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timedelta, timezone

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат даты. Используйте YYYY-MM-DD"
        )

    offset = timedelta(minutes=tz_offset_minutes)
    tz = timezone(offset)
    start_local = datetime.combine(target_date, datetime.min.time())
    end_local = start_local + timedelta(days=1)

    start_utc = (start_local - offset).replace(tzinfo=timezone.utc)
    end_utc = (end_local - offset).replace(tzinfo=timezone.utc)

    photos = (
        db.query(MealPhoto)
        .filter(
            MealPhoto.user_id == current_user.id,
            MealPhoto.created_at >= start_utc,
            MealPhoto.created_at < end_utc,
        )
        .order_by(MealPhoto.created_at.desc())
        .all()
    )

    total_calories = sum(p.calories or 0 for p in photos)
    total_protein = sum(p.protein or 0 for p in photos)
    total_fat = sum(p.fat or 0 for p in photos)
    total_carbs = sum(p.carbs or 0 for p in photos)
    total_fiber = sum(p.fiber or 0 for p in photos)
    total_sugar = sum(p.sugar or 0 for p in photos)
    total_sodium = sum(p.sodium or 0 for p in photos)

    target_calories = None
    onboarding = (
        db.query(OnboardingData)
        .filter(OnboardingData.user_id == current_user.id, OnboardingData.target_calories != None)
        .order_by(OnboardingData.id.desc())
        .first()
    )
    if onboarding:
        target_calories = onboarding.target_calories

    streak_count = current_user.streak_count or 0
    last_streak_date = current_user.last_streak_date.date() if current_user.last_streak_date else None
    try:
        today_date = datetime.now(timezone.utc).date()
        yesterday = today_date - timedelta(days=1)
        
        if last_streak_date and last_streak_date < yesterday:
            streak_count = 0
            current_user.streak_count = 0
            db.commit()
            db.refresh(current_user)
        
        if target_calories is not None and target_calories > 0 and target_date <= today_date:
            achieved = total_calories >= target_calories
            
            if last_streak_date and target_date < last_streak_date:
                pass
            else:
                if achieved:
                    if last_streak_date is None:
                        streak_count = 1
                    else:
                        delta = (target_date - last_streak_date).days
                        if delta == 0:
                            streak_count = current_user.streak_count or 1
                        elif delta == 1:
                            streak_count = (current_user.streak_count or 0) + 1
                        else:
                            streak_count = 1
                    current_user.last_streak_date = datetime.combine(target_date, datetime.min.time())
                    current_user.streak_count = streak_count
                    db.commit()
                    db.refresh(current_user)
    except Exception as e:
        logger.warning(f"Failed to update streak: {e}")

    health_score = None
    if len(photos) >= 1 and total_calories > 0:
        score = 50
        
        fiber_bonus = min(20, (total_fiber / 38) * 20) if total_fiber else 0
        
        protein_bonus = min(15, (total_protein / 70) * 15) if total_protein else 0
        
        sugar_penalty = min(20, max(0, (total_sugar - 25) / 65 * 20)) if total_sugar else 0
        
        sodium_penalty = min(15, max(0, (total_sodium - 1500) / 2000 * 15)) if total_sodium else 0
        
        score = score + fiber_bonus + protein_bonus - sugar_penalty - sodium_penalty
        health_score = max(0, min(100, int(score)))

    return {
        "date": date,
        "total_calories": total_calories,
        "total_protein": total_protein,
        "total_fat": total_fat,
        "total_carbs": total_carbs,
        "total_fiber": total_fiber,
        "total_sugar": total_sugar,
        "total_sodium": total_sodium,
        "health_score": health_score,
        "streak_count": current_user.streak_count or 0,
        "meals": [
            {
                "id": p.id,
                "name": p.meal_name or p.detected_meal_name or "Блюдо",
                "time": p.created_at.astimezone(tz).strftime("%H:%M"),
                "calories": p.calories or 0,
                "protein": p.protein or 0,
                "carbs": p.carbs or 0,
                "fats": p.fat or 0,
                "fiber": p.fiber or 0,
                "sugar": p.sugar or 0,
                "sodium": p.sodium or 0,
            }
            for p in photos
        ]
    }

@router.post("/meals/daily/batch")
def get_daily_meals_batch(
    payload: dict = Body(..., example={"dates": ["2025-12-10", "2025-12-11"]}),
    tz_offset_minutes: int = Query(0, description="Смещение клиента в минутах от UTC (getTimezoneOffset * -1)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timedelta, timezone

    dates: list = payload.get("dates") or []
    results = []
    offset = timedelta(minutes=tz_offset_minutes)
    tz = timezone(offset)

    for date_str in dates:
      try:
          target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
      except ValueError:
          continue

      start_local = datetime.combine(target_date, datetime.min.time())
      end_local = start_local + timedelta(days=1)
      start_utc = (start_local - offset).replace(tzinfo=timezone.utc)
      end_utc = (end_local - offset).replace(tzinfo=timezone.utc)

      photos = (
          db.query(MealPhoto)
          .filter(
              MealPhoto.user_id == current_user.id,
              MealPhoto.created_at >= start_utc,
              MealPhoto.created_at < end_utc,
          )
          .order_by(MealPhoto.created_at.desc())
          .all()
      )

      total_calories = sum(p.calories or 0 for p in photos)
      total_protein = sum(p.protein or 0 for p in photos)
      total_fat = sum(p.fat or 0 for p in photos)
      total_carbs = sum(p.carbs or 0 for p in photos)
      total_fiber = sum(p.fiber or 0 for p in photos)
      total_sugar = sum(p.sugar or 0 for p in photos)
      total_sodium = sum(p.sodium or 0 for p in photos)

      results.append({
          "date": date_str,
          "total_calories": total_calories,
          "total_protein": total_protein,
          "total_fat": total_fat,
          "total_carbs": total_carbs,
          "total_fiber": total_fiber,
          "total_sugar": total_sugar,
          "total_sodium": total_sodium,
          "meals": [
              {
                  "id": p.id,
                  "name": p.meal_name or p.detected_meal_name or "Блюдо",
                  "time": p.created_at.astimezone(tz).strftime("%H:%M"),
                  "calories": p.calories or 0,
                  "protein": p.protein or 0,
                  "carbs": p.carbs or 0,
                  "fats": p.fat or 0,
              }
              for p in photos
          ]
      })

    return results

@router.put("/meals/photos/{photo_id}", response_model=MealPhotoResponse)
def update_meal_photo(
    photo_id: int,
    payload: MealPhotoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = db.query(MealPhoto).filter(
        MealPhoto.id == photo_id,
        MealPhoto.user_id == current_user.id
    ).first()

    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Фотография не найдена"
        )

    if payload.meal_name is not None:
        photo.meal_name = payload.meal_name
    if payload.calories is not None:
        photo.calories = payload.calories
    if payload.protein is not None:
        photo.protein = payload.protein
    if payload.fat is not None:
        photo.fat = payload.fat
    if payload.carbs is not None:
        photo.carbs = payload.carbs

    db.commit()
    db.refresh(photo)
    return photo

@router.delete("/meals/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = db.query(MealPhoto).filter(
        MealPhoto.id == photo_id,
        MealPhoto.user_id == current_user.id
    ).first()

    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Фотография не найдена"
        )

    full_path = MEDIA_ROOT.parent / photo.file_path
    if full_path.exists():
        full_path.unlink()

    db.delete(photo)
    db.commit()

    return None

@router.post("/water", response_model=WaterEntry, status_code=status.HTTP_201_CREATED)
def add_water(
    payload: WaterCreate,
    tz_offset_minutes: int = Query(0, description="Смещение клиента в минутах от UTC (getTimezoneOffset * -1)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import timezone, timedelta

    created_at = payload.created_at
    if created_at is None:
        created_at = datetime.now(timezone.utc)
    elif created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone(timedelta(minutes=tz_offset_minutes or 0))).astimezone(timezone.utc)

    entry = WaterLog(
        user_id=current_user.id,
        amount_ml=payload.amount_ml,
        goal_ml=payload.goal_ml,
        created_at=created_at,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.get("/water/daily", response_model=WaterDailyResponse)
def get_water_daily(
    date: str = Query(..., description="Дата в формате YYYY-MM-DD"),
    tz_offset_minutes: int = Query(0, description="Смещение клиента в минутах от UTC (getTimezoneOffset * -1)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timedelta, timezone

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат даты. Используйте YYYY-MM-DD"
        )

    offset = timedelta(minutes=tz_offset_minutes)
    start_local = datetime.combine(target_date, datetime.min.time())
    end_local = start_local + timedelta(days=1)
    start_utc = (start_local - offset).replace(tzinfo=timezone.utc)
    end_utc = (end_local - offset).replace(tzinfo=timezone.utc)

    entries = (
        db.query(WaterLog)
        .filter(
            WaterLog.user_id == current_user.id,
            WaterLog.created_at >= start_utc,
            WaterLog.created_at < end_utc,
        )
        .order_by(WaterLog.created_at.desc())
        .all()
    )

    total_ml = sum(e.amount_ml or 0 for e in entries)
    goal_ml = None
    if entries:
        last = entries[0]
        goal_ml = last.goal_ml

    return WaterDailyResponse(
        date=date,
        total_ml=total_ml,
        goal_ml=goal_ml,
        entries=entries,
    )
