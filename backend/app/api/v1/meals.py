"""
API endpoints для работы с фотографиями еды
"""
import uuid
import logging
import json
import base64
import re
from pathlib import Path
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status, Query, Header
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.meal_photo import MealPhoto
from app.schemas.meal_photo import MealPhotoUploadResponse, MealPhotoResponse, MealPhotoCreate
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

_BACKEND_DIR = Path(__file__).parent.parent.parent.parent  # backend/
_PROJECT_ROOT = _BACKEND_DIR.parent  
MEDIA_ROOT = _PROJECT_ROOT / "media" / "meal_photos"

try:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    logger.info(f"Media directory initialized at: {MEDIA_ROOT}")
except Exception as e:
    logger.error(f"Failed to create media directory at {MEDIA_ROOT}: {e}")
    raise

def get_user_media_dir(user_id: int) -> Path:
    """Получить директорию для медиа файлов пользователя"""
    user_dir = MEDIA_ROOT / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


async def get_nutrition_insights(file_path: Path, meal_name_hint: Optional[str]) -> Optional[Dict[str, Any]]:

    api_key = settings.ai_nutrition_api_key
    if not api_key:
        return None

    base_url = getattr(settings, "ai_nutrition_base_url", "https://router.huggingface.co/v1").rstrip("/")
    api_url = f"{base_url}/chat/completions"
    model_name = getattr(settings, "ai_nutrition_model", "Qwen/Qwen2.5-VL-7B-Instruct")

    try:
        mime_guess = "image/jpeg"
        suffix = file_path.suffix.lower()
        if suffix in {".png"}:
            mime_guess = "image/png"
        elif suffix in {".webp"}:
            mime_guess = "image/webp"
        elif suffix in {".heic", ".heif"}:
            mime_guess = "image/heic"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        with open(file_path, "rb") as f:
            b64_image = base64.b64encode(f.read()).decode("utf-8")

        prompt = (
            "You are a nutrition assistant. Given a food photo, respond ONLY with JSON "
            'like {\"name\":\"...\",\"calories\":number,\"protein\":number,\"fat\":number,\"carbs\":number}. '
            "Use integers, no units."
        )
        if meal_name_hint:
            prompt = f"{prompt} Hint: {meal_name_hint}."

        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_guess};base64,{b64_image}"
                            },
                        }
                    ],
                }
            ],
            "max_tokens": 256,
            "temperature": 0.1,
        }

        async with httpx.AsyncClient(timeout=settings.ai_nutrition_timeout) as client:
            response = await client.post(
                api_url,
                headers=headers,
                data=json.dumps(payload),
            )
            if response.status_code in (401, 403, 410, 400):
                logger.warning(f"Hugging Face returned {response.status_code}. Body: {response.text}")
                return None
            response.raise_for_status()

        resp_json = response.json()
        generated_text = None
        if isinstance(resp_json, dict):
            choices = resp_json.get("choices") or []
            if choices:
                msg = choices[0].get("message") or {}
                generated_text = msg.get("content")

        if not generated_text:
            return None

        extracted = None
        try:
            # Найти JSON в тексте
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
                "detected_meal_name": extracted.get("name") or meal_name_hint,
            }

        return None
    except Exception as e:
        logger.warning(f"AI nutrition call failed: {e}")
        return None


@router.post("/meals/upload", response_model=MealPhotoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_meal_photo(
    file: UploadFile = File(...),
    barcode: str = Form(default=""),
    meal_name: str = Form(default=""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Загрузка фотографии еды
    """
    logger.info(f"Upload request from user {current_user.id}, filename: {file.filename}, content_type: {file.content_type}")
    
    # Проверяем тип файла
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
    
    # Обрабатываем опциональные параметры
    barcode_value = barcode.strip() if barcode and barcode.strip() else None
    meal_name_value = meal_name.strip() if meal_name and meal_name.strip() else None
    
    # Генерируем уникальное имя файла
    file_ext = Path(file.filename or "photo").suffix or ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Получаем директорию пользователя
    user_dir = get_user_media_dir(current_user.id)
    file_path = user_dir / unique_filename
    
    try:
        # Сохраняем файл
        contents = await file.read()
        file_size = len(contents)
        
        logger.info(f"File size: {file_size} bytes, saving to: {file_path}")
        
        # Убеждаемся, что директория существует
        user_dir.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Сохраняем путь относительно media директории
        relative_path = f"meal_photos/{current_user.id}/{unique_filename}"

        # Вызываем внешнюю AI-модель для получения БЖУ
        nutrition = await get_nutrition_insights(
            file_path=file_path,
            meal_name_hint=meal_name_value,
        )
        
        # Создаем запись в БД
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
        )
        
        db.add(meal_photo)
        db.commit()
        db.refresh(meal_photo)
        
        logger.info(f"Photo saved with ID: {meal_photo.id}")
        
        # Формируем URL для доступа к файлу
        photo_url = f"{settings.api_domain}/api/v1/meals/photos/{meal_photo.id}"
        
        return MealPhotoUploadResponse(
            photo=MealPhotoResponse.model_validate(meal_photo),
            url=photo_url,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading photo: {str(e)}", exc_info=True)
        # Если произошла ошибка, удаляем файл если он был создан
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
    """
    Получить список всех фотографий еды пользователя
    """
    photos = db.query(MealPhoto)\
        .filter(MealPhoto.user_id == current_user.id)\
        .order_by(MealPhoto.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return photos


@router.get("/meals/photos/{photo_id}", response_class=FileResponse)
def get_meal_photo(
    photo_id: int,
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Получить фотографию еды по ID
    """
    # Авторизация: сначала Authorization header, иначе пробуем token из query
    current_user: Optional[User] = None
    if authorization:
        try:
            # Используем существующий dependency вручную
            # Формат "Bearer xxx"
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
    
    # Полный путь к файлу
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
    """
    Подтвердить и сохранить данные блюда (с возможностью редактирования)
    """
    photo = db.query(MealPhoto).filter(
        MealPhoto.id == photo_id,
        MealPhoto.user_id == current_user.id
    ).first()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Фотография не найдена"
        )
    
    # Обновляем данные если переданы
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
    
    # Помечаем как подтвержденное
    photo.is_confirmed = True
    
    db.commit()
    db.refresh(photo)
    
    return photo


@router.get("/meals/daily")
def get_daily_meals(
    date: str = Query(..., description="Дата в формате YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Получить блюда за конкретный день
    """
    from datetime import datetime
    
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат даты. Используйте YYYY-MM-DD"
        )
    
    photos = db.query(MealPhoto)\
        .filter(
            MealPhoto.user_id == current_user.id,
            MealPhoto.is_confirmed == True,
            func.date(MealPhoto.created_at) == target_date
        )\
        .order_by(MealPhoto.created_at.desc())\
        .all()
    
    # Суммируем КБЖУ за день
    total_calories = sum(p.calories or 0 for p in photos)
    total_protein = sum(p.protein or 0 for p in photos)
    total_fat = sum(p.fat or 0 for p in photos)
    total_carbs = sum(p.carbs or 0 for p in photos)
    
    return {
        "date": date,
        "total_calories": total_calories,
        "total_protein": total_protein,
        "total_fat": total_fat,
        "total_carbs": total_carbs,
        "meals": [
            {
                "id": p.id,
                "name": p.meal_name or p.detected_meal_name or "Блюдо",
                "time": p.created_at.strftime("%H:%M"),
                "calories": p.calories or 0,
                "protein": p.protein or 0,
                "carbs": p.carbs or 0,
                "fats": p.fat or 0,
            }
            for p in photos
        ]
    }


@router.put("/meals/photos/{photo_id}", response_model=MealPhotoResponse)
def update_meal_photo(
    photo_id: int,
    payload: MealPhotoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Обновить данные фотографии (название, КБЖУ)
    """
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
    """
    Удалить фотографию еды
    """
    photo = db.query(MealPhoto).filter(
        MealPhoto.id == photo_id,
        MealPhoto.user_id == current_user.id
    ).first()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Фотография не найдена"
        )
    
    # Удаляем файл
    full_path = MEDIA_ROOT.parent / photo.file_path
    if full_path.exists():
        full_path.unlink()
    
    # Удаляем запись из БД
    db.delete(photo)
    db.commit()
    
    return None
