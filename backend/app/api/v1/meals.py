import uuid
import logging
import json
import re
import tempfile
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status, Query, Header, Body
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.models.meal_photo import MealPhoto
from app.models.water_log import WaterLog
from app.models.onboarding_data import OnboardingData
from app.schemas.meal_photo import MealPhotoUploadResponse, MealPhotoResponse, MealPhotoCreate
from app.schemas.water import WaterCreate, WaterDailyResponse, WaterEntry
from app.services.storage import storage_service
from app.services.ai_service import ai_service
from app.utils.date_utils import get_day_range_utc

logger = logging.getLogger(__name__)
router = APIRouter()



async def fetch_openfoodfacts_product(barcode: str) -> Optional[Dict[str, Any]]:
    hosts = [
        "https://world.openfoodfacts.org",
        "https://ru.openfoodfacts.org",
    ]

    for host in hosts:
        url = f"{host}/api/v2/product/{barcode}.json"
        try:
            async with httpx.AsyncClient(timeout=12) as client:
                resp = await client.get(url)
                if resp.status_code == 404:
                    continue
                resp.raise_for_status()
                data = resp.json()
                if data.get("status") == 1 and data.get("product"):
                    return data.get("product")
        except httpx.HTTPStatusError:
            continue
        except Exception:
            continue

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

    from app.core.security import validate_file_content, validate_file_size, sanitize_filename
    from app.core.config import settings
    
    allowed_mime_types = settings.allowed_file_types
    
    if not file.content_type or file.content_type not in allowed_mime_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неподдерживаемый тип файла"
        )

    barcode_value = barcode.strip() if barcode and barcode.strip() else None
    meal_name_value = meal_name.strip() if meal_name and meal_name.strip() else None

    original_filename = file.filename or "photo"
    sanitized_filename = sanitize_filename(original_filename)
    file_ext = Path(sanitized_filename).suffix or ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    s3_object_path = f"meal_photos/{current_user.id}/{unique_filename}"

    try:
        contents = await file.read()
        file_size = len(contents)
        
        # Валидация размера файла
        if not validate_file_size(file_size, max_size_mb=settings.max_file_size_mb):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Файл слишком большой. Максимальный размер: {settings.max_file_size_mb}MB"
            )
        
        # Валидация реального содержимого файла (magic bytes)
        if not validate_file_content(contents, file.content_type):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Файл не соответствует заявленному типу"
            )
        
        # Явно закрываем UploadFile для освобождения ресурсов
        await file.close()

        # Загружаем файл в Yandex Object Storage
        file_url = storage_service.upload_file(
            file_content=contents,
            object_name=s3_object_path,
            content_type=file.content_type
        )
        

        if client_timestamp and client_tz_offset_minutes is not None:
            try:
                ts_str = client_timestamp.replace('Z', '')
                
                client_dt = datetime.fromisoformat(ts_str)
                
                client_tz = timezone(timedelta(minutes=client_tz_offset_minutes))
                client_dt = client_dt.replace(tzinfo=client_tz)
                
                created_at_now = client_dt.astimezone(timezone.utc)
            except (ValueError, AttributeError):
                created_at_now = datetime.now(timezone.utc)
        else:
            created_at_now = datetime.now(timezone.utc)

        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
                temp_file.write(contents)
                temp_file_path = Path(temp_file.name)
            
            nutrition = await ai_service.analyze_meal_photo(
                file_path=temp_file_path,
                meal_name_hint=meal_name_value,
            )
        finally:
            if temp_file_path and temp_file_path.exists():
                try:
                    os.unlink(temp_file_path)
                except Exception:
                    pass


        meal_photo = MealPhoto(
            user_id=current_user.id,
            file_path=s3_object_path,  # Путь в S3
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
            health_score=nutrition.get("health_score") if nutrition else None,
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
        # При ошибке можно попытаться удалить файл из S3
        try:
            storage_service.delete_file(s3_object_path)
        except:
            pass
        
        # Старый код удаления локального файла больше не нужен
        if False:  # Отключено
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
            ts_str = client_timestamp.replace('Z', '')
            client_dt = datetime.fromisoformat(ts_str)
            client_tz = timezone(timedelta(minutes=client_tz_offset_minutes))
            client_dt = client_dt.replace(tzinfo=client_tz)
            created_at = client_dt.astimezone(timezone.utc)
        except (ValueError, AttributeError) as e:
            created_at = datetime.now(timezone.utc)
    elif payload.created_at:
        try:
            ts_str = payload.created_at.replace('Z', '')
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

    from fastapi.responses import RedirectResponse
    file_url = storage_service.get_file_url(photo.file_path)
    
    return RedirectResponse(url=file_url)

@router.get("/meals/photos/{photo_id}/detail")
def get_meal_photo_detail(
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
            "fiber": photo.fiber,
            "sugar": photo.sugar,
            "sodium": photo.sodium,
            "health_score": photo.health_score,
            "created_at": photo.created_at.isoformat() if photo.created_at else None,
            "updated_at": photo.updated_at.isoformat() if photo.updated_at else None,
        },
        "url": photo_url,
        "ingredients": json.loads(getattr(photo, 'ingredients_json', None)) if getattr(photo, 'ingredients_json', None) else None,
        "extra_macros": {
            "fiber": photo.fiber or 0,
            "sugar": photo.sugar or 0,
            "sodium": photo.sodium or 0,
        },
        "health_score": photo.health_score,
    }


@router.get("/meals/barcode/{barcode}")
async def lookup_barcode(
    barcode: str,
    current_user: User = Depends(get_current_user),
):
    code = re.sub(r"\D", "", barcode or "")
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Некорректный штрихкод",
        )

    product = await fetch_openfoodfacts_product(code)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Продукт не найден",
        )

    nutriments = product.get("nutriments", {}) if isinstance(product, dict) else {}

    def _num(val: Any) -> Optional[int]:
        try:
            if val is None:
                return None
            return int(float(val))
        except Exception:
            return None

    # Получаем базовые данные из OpenFoodFacts
    base_data = {
        "barcode": code,
        "name": product.get("product_name") or product.get("generic_name") or "Продукт",
        "brand": product.get("brands"),
        "calories": _num(
            nutriments.get("energy-kcal_100g")
            or nutriments.get("energy_kcal_value")
            or nutriments.get("energy_kcal")
        ),
        "protein": _num(nutriments.get("proteins_100g") or nutriments.get("proteins_serving")),
        "fat": _num(nutriments.get("fat_100g") or nutriments.get("fat_serving")),
        "carbs": _num(
            nutriments.get("carbohydrates_100g")
            or nutriments.get("carbohydrates_serving")
        ),
    }
    
    fiber_off = _num(nutriments.get("fiber_100g") or nutriments.get("fiber_serving"))
    sugar_off = _num(nutriments.get("sugars_100g") or nutriments.get("sugars_serving"))
    sodium_off = _num(nutriments.get("sodium_100g") or nutriments.get("sodium_serving"))
    
    ai_analysis = await ai_service.analyze_barcode_product(product)
    
    if ai_analysis:
        base_data["fiber"] = fiber_off if fiber_off is not None else ai_analysis.get("fiber")
        base_data["sugar"] = sugar_off if sugar_off is not None else ai_analysis.get("sugar")
        base_data["sodium"] = sodium_off if sodium_off is not None else ai_analysis.get("sodium")
        base_data["health_score"] = ai_analysis.get("health_score")
    else:
        base_data["fiber"] = fiber_off
        base_data["sugar"] = sugar_off
        base_data["sodium"] = sodium_off
        base_data["health_score"] = None
    
    return base_data

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
    try:
        start_utc, end_utc, tz = get_day_range_utc(date, tz_offset_minutes)
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат даты. Используйте YYYY-MM-DD"
        )

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
        pass

    meals_data = []
    health_scores = []
    
    for p in photos:
        meal_score = p.health_score
        if meal_score is not None:
            health_scores.append(meal_score)
        
        meals_data.append({
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
            "health_score": meal_score,
        })
    
    avg_health_score = None
    if health_scores:
        avg_health_score = round(sum(health_scores) / len(health_scores), 1)

    return {
        "date": date,
        "total_calories": total_calories,
        "total_protein": total_protein,
        "total_fat": total_fat,
        "total_carbs": total_carbs,
        "total_fiber": total_fiber,
        "total_sugar": total_sugar,
        "total_sodium": total_sodium,
        "health_score": avg_health_score,
        "streak_count": current_user.streak_count or 0,
        "meals": meals_data,
    }

@router.post("/meals/daily/batch")
def get_daily_meals_batch(
    payload: dict = Body(..., example={"dates": ["2025-12-10", "2025-12-11"]}),
    tz_offset_minutes: int = Query(0, description="Смещение клиента в минутах от UTC (getTimezoneOffset * -1)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dates: list = payload.get("dates") or []
    results = []

    for date_str in dates:
      try:
          start_utc, end_utc, tz = get_day_range_utc(date_str, tz_offset_minutes)
      except ValueError:
          continue

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

      meals_data = []
      health_scores = []
      
      for p in photos:
          meal_score = p.health_score
          if meal_score is not None:
              health_scores.append(meal_score)
          
          meals_data.append({
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
              "health_score": meal_score,
          })
      
      avg_health_score = None
      if health_scores:
          avg_health_score = round(sum(health_scores) / len(health_scores), 1)

      results.append({
          "date": date_str,
          "total_calories": total_calories,
          "total_protein": total_protein,
          "total_fat": total_fat,
          "total_carbs": total_carbs,
          "total_fiber": total_fiber,
          "total_sugar": total_sugar,
          "total_sodium": total_sodium,
          "health_score": avg_health_score,
          "meals": meals_data,
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

    if photo.file_path and photo.file_path != "manual" and photo.mime_type != "manual":
        try:
            storage_service.delete_file(photo.file_path)
        except Exception:
            pass

    db.delete(photo)
    db.commit()

    return None

@router.post("/meals/photos/{photo_id}/ingredients")
async def add_meal_ingredient(
    photo_id: int,
    ingredient: Dict[str, Any] = Body(...),
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
    
    current_ingredients = []
    ingredients_json = getattr(photo, 'ingredients_json', None)
    if ingredients_json:
        try:
            current_ingredients = json.loads(ingredients_json)
        except Exception:
            current_ingredients = []
    
    new_ingredient = {
        "name": ingredient.get("name", "Ингредиент"),
        "calories": ingredient.get("calories", 0)
    }
    current_ingredients.append(new_ingredient)
    
    if hasattr(photo, 'ingredients_json'):
        photo.ingredients_json = json.dumps(current_ingredients, ensure_ascii=False)
        db.commit()
    else:
        db.commit()
    
    return {"success": True, "ingredients": current_ingredients}

@router.post("/meals/photos/{photo_id}/correct")
async def correct_meal_with_ai(
    photo_id: int,
    correction_request: Dict[str, str] = Body(...),
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
    
    if not ai_service.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI сервис недоступен"
        )

    correction_text = correction_request.get("correction", "")
    
    if not correction_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не указано, что нужно исправить"
        )
    
    current_data = {
        "name": photo.meal_name or photo.detected_meal_name,
        "calories": photo.calories,
        "protein": photo.protein,
        "fat": photo.fat,
        "carbs": photo.carbs,
        "fiber": photo.fiber,
        "sugar": photo.sugar,
        "sodium": photo.sodium,
        "health_score": photo.health_score,
    }
    
    try:
        corrected = await ai_service.correct_meal(current_data, correction_text)
        
        if not corrected:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Не удалось обработать коррекцию"
            )

        if corrected.get("name"):
            photo.meal_name = corrected["name"]
        if corrected.get("calories") is not None:
            photo.calories = corrected["calories"]
        if corrected.get("protein") is not None:
            photo.protein = corrected["protein"]
        if corrected.get("fat") is not None:
            photo.fat = corrected["fat"]
        if corrected.get("carbs") is not None:
            photo.carbs = corrected["carbs"]
        if corrected.get("fiber") is not None:
            photo.fiber = corrected["fiber"]
        if corrected.get("sugar") is not None:
            photo.sugar = corrected["sugar"]
        if corrected.get("sodium") is not None:
            photo.sodium = corrected["sodium"]
        if corrected.get("health_score") is not None:
            photo.health_score = corrected["health_score"]
        
        if corrected.get("ingredients") and hasattr(photo, 'ingredients_json'):
            photo.ingredients_json = json.dumps(corrected["ingredients"], ensure_ascii=False)
        
        db.commit()
        db.refresh(photo)
        
        ingredients = []
        ingredients_json = getattr(photo, 'ingredients_json', None)
        if ingredients_json:
            try:
                ingredients = json.loads(ingredients_json)
            except Exception:
                pass
        
        return {
            "meal_name": photo.meal_name,
            "calories": photo.calories,
            "protein": photo.protein,
            "fats": photo.fat,
            "carbs": photo.carbs,
            "ingredients": ingredients,
            "extra_macros": {
                "fiber": photo.fiber or 0,
                "sugar": photo.sugar or 0,
                "sodium": photo.sodium or 0,
            },
            "health_score": photo.health_score,
        }

    except HTTPException:
        raise
    except Exception as e:
        pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при исправлении: {str(e)}"
        )

@router.post("/water", response_model=WaterEntry, status_code=status.HTTP_201_CREATED)
def add_water(
    payload: WaterCreate,
    tz_offset_minutes: int = Query(0, description="Смещение клиента в минутах от UTC"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import timezone, timedelta

    created_at = payload.created_at
    if created_at is None:
        created_at = datetime.now(timezone.utc)
    elif created_at.tzinfo is None:
        client_tz = timezone(timedelta(minutes=tz_offset_minutes or 0))
        created_at = created_at.replace(tzinfo=client_tz).astimezone(timezone.utc)

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

@router.post("/recipes/generate")
async def generate_recipe(
    request: Dict[str, str] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Генерирует рецепт через AI и автоматически добавляет в рацион."""
    user_request = request.get("prompt", "").strip()
    
    if not user_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Опишите желаемый рецепт"
        )
    
    recipe = await ai_service.generate_recipe(user_request)
    
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось сгенерировать рецепт"
        )
    
    created_at = datetime.now(timezone.utc)
    
    meal_photo = MealPhoto(
        user_id=current_user.id,
        file_path="",
        file_name="ai_recipe",
        file_size=0,
        mime_type="text/plain",
        meal_name=recipe.get("name"),
        detected_meal_name=recipe.get("name"),
        calories=recipe.get("calories"),
        protein=recipe.get("protein"),
        fat=recipe.get("fat"),
        carbs=recipe.get("carbs"),
        created_at=created_at,
    )
    
    db.add(meal_photo)
    db.commit()
    db.refresh(meal_photo)
    
    return {
        "recipe": recipe,
        "meal_id": meal_photo.id,
        "added_to_diet": True,
    }

@router.get("/recipes/popular")
def get_popular_recipes(
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Возвращает популярные рецепты на основе статистики всех пользователей."""
    popular_meals = (
        db.query(
            MealPhoto.meal_name,
            MealPhoto.detected_meal_name,
            MealPhoto.calories,
            MealPhoto.protein,
            MealPhoto.fat,
            MealPhoto.carbs,
            func.count(MealPhoto.id).label("count"),
            func.avg(MealPhoto.calories).label("avg_calories"),
        )
        .filter(
            MealPhoto.meal_name.isnot(None),
            MealPhoto.meal_name != "",
            MealPhoto.calories.isnot(None),
            MealPhoto.file_name != "ai_recipe",
        )
        .group_by(MealPhoto.meal_name)
        .order_by(func.count(MealPhoto.id).desc())
        .limit(limit)
        .all()
    )
    
    results = []
    for meal in popular_meals:
        meal_name = meal.meal_name or meal.detected_meal_name or "Блюдо"
        results.append({
            "name": meal_name,
            "calories": int(meal.avg_calories) if meal.avg_calories else meal.calories,
            "protein": meal.protein,
            "fat": meal.fat,
            "carbs": meal.carbs,
            "count": meal.count,
        })
    
    return results
