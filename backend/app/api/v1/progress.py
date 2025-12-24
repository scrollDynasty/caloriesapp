"""
API для прогресса
"""
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.weight_log import WeightLog
from app.models.progress_photo import ProgressPhoto
from app.models.meal_photo import MealPhoto
from app.models.onboarding_data import OnboardingData
from app.schemas.progress import (
    WeightLogCreate,
    WeightLogResponse,
    WeightStats,
    WeightChange,
    ProgressPhotoUploadResponse,
    ProgressPhotoResponse,
    ProgressData,
    CalorieStats,
    EnergyChange,
)

logger = logging.getLogger(__name__)
router = APIRouter()

_BACKEND_DIR = Path(__file__).parent.parent.parent.parent
_PROJECT_ROOT = _BACKEND_DIR.parent
PROGRESS_PHOTOS_DIR = _PROJECT_ROOT / "progress_photos"
PROGRESS_PHOTOS_DIR.mkdir(exist_ok=True)


@router.post("/weight", response_model=WeightLogResponse, status_code=status.HTTP_201_CREATED)
def add_weight(
    payload: WeightLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Добавить запись о весе"""
    created_at = payload.created_at
    if created_at is None:
        created_at = datetime.now(timezone.utc)
    elif created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    entry = WeightLog(
        user_id=current_user.id,
        weight=payload.weight,
        created_at=created_at,
    )
    db.add(entry)
    
    # Обновляем текущий вес в onboarding_data
    onboarding = db.query(OnboardingData).filter(OnboardingData.user_id == current_user.id).first()
    if onboarding:
        onboarding.weight = payload.weight
    
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/weight/history", response_model=List[WeightLogResponse])
def get_weight_history(
    limit: int = Query(100, description="Максимальное количество записей"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить историю веса"""
    entries = (
        db.query(WeightLog)
        .filter(WeightLog.user_id == current_user.id)
        .order_by(WeightLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return entries


@router.get("/weight/stats", response_model=WeightStats)
def get_weight_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить статистику веса"""
    # Получаем onboarding данные
    onboarding = db.query(OnboardingData).filter(OnboardingData.user_id == current_user.id).first()
    
    # Получаем всю историю веса
    all_weights = (
        db.query(WeightLog)
        .filter(WeightLog.user_id == current_user.id)
        .order_by(WeightLog.created_at.asc())
        .all()
    )
    
    current_weight = onboarding.weight if onboarding else None
    target_weight = onboarding.target_weight if onboarding else None
    start_weight = all_weights[0].weight if all_weights else current_weight
    
    total_change = None
    if start_weight and current_weight:
        total_change = current_weight - start_weight
    
    # Вычисляем изменения за разные периоды
    now = datetime.now(timezone.utc)
    periods = [
        ("3_days", 3),
        ("7_days", 7),
        ("14_days", 14),
        ("30_days", 30),
        ("90_days", 90),
    ]
    
    changes = []
    for period_name, days in periods:
        start_date = now - timedelta(days=days)
        period_weights = [w for w in all_weights if w.created_at >= start_date]
        
        if len(period_weights) >= 2:
            first_weight = period_weights[0].weight
            last_weight = period_weights[-1].weight
            change_kg = last_weight - first_weight
            
            if abs(change_kg) < 0.1:
                status_val = "no_change"
            elif change_kg > 0:
                status_val = "gain"
            else:
                status_val = "loss"
                
            changes.append(WeightChange(
                period=period_name,
                change_kg=round(change_kg, 1),
                status=status_val
            ))
        else:
            changes.append(WeightChange(
                period=period_name,
                change_kg=None,
                status="insufficient_data"
            ))
    
    # Добавляем "all_time"
    if len(all_weights) >= 2:
        first_weight = all_weights[0].weight
        last_weight = all_weights[-1].weight
        change_kg = last_weight - first_weight
        
        if abs(change_kg) < 0.1:
            status_val = "no_change"
        elif change_kg > 0:
            status_val = "gain"
        else:
            status_val = "loss"
            
        changes.append(WeightChange(
            period="all_time",
            change_kg=round(change_kg, 1),
            status=status_val
        ))
    else:
        changes.append(WeightChange(
            period="all_time",
            change_kg=None,
            status="insufficient_data"
        ))
    
    # Получаем последние 90 дней для графика
    ninety_days_ago = now - timedelta(days=90)
    recent_weights = [w for w in all_weights if w.created_at >= ninety_days_ago]
    
    return WeightStats(
        current_weight=current_weight,
        target_weight=target_weight,
        start_weight=start_weight,
        total_change=total_change,
        changes=changes,
        history=recent_weights
    )


@router.post("/photos", response_model=ProgressPhotoUploadResponse)
async def upload_progress_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Загрузить фото прогресса"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть изображением"
        )
    
    # Генерируем уникальное имя файла
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    unique_name = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    file_path = PROGRESS_PHOTOS_DIR / unique_name
    
    # Сохраняем файл
    content = await file.read()
    file_path.write_bytes(content)
    
    # Создаем запись в БД
    photo = ProgressPhoto(
        user_id=current_user.id,
        file_path=str(file_path),
        file_name=unique_name,
        file_size=len(content),
        mime_type=file.content_type,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    
    return ProgressPhotoUploadResponse(
        id=photo.id,
        file_name=photo.file_name,
        url=f"/api/v1/progress/photos/{photo.id}",
        created_at=photo.created_at
    )


@router.get("/photos", response_model=List[ProgressPhotoResponse])
def get_progress_photos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить все фото прогресса"""
    photos = (
        db.query(ProgressPhoto)
        .filter(ProgressPhoto.user_id == current_user.id)
        .order_by(ProgressPhoto.created_at.desc())
        .all()
    )
    return photos


@router.get("/photos/{photo_id}")
def get_progress_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить фото прогресса по ID"""
    photo = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == photo_id,
        ProgressPhoto.user_id == current_user.id
    ).first()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Фото не найдено"
        )
    
    file_path = Path(photo.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден"
        )
    
    return FileResponse(file_path, media_type=photo.mime_type)


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_progress_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Удалить фото прогресса"""
    photo = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == photo_id,
        ProgressPhoto.user_id == current_user.id
    ).first()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Фото не найдено"
        )
    
    # Удаляем файл
    file_path = Path(photo.file_path)
    if file_path.exists():
        file_path.unlink()
    
    # Удаляем запись из БД
    db.delete(photo)
    db.commit()


@router.get("/data", response_model=ProgressData)
def get_progress_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить все данные прогресса"""
    # Получаем streak
    streak_count = current_user.streak_count or 0
    
    # Получаем количество значков (пока 0, можно добавить логику)
    badges_count = 0
    
    # Получаем статистику веса
    weight_stats = get_weight_stats(current_user, db)
    
    # Получаем статистику калорий за недели
    now = datetime.now(timezone.utc)
    calorie_stats_list = []
    
    for week_offset in range(4):  # 4 недели
        week_start = now - timedelta(days=now.weekday() + 7 * week_offset + 7)
        week_end = week_start + timedelta(days=7)
        
        # Получаем все приемы пищи за неделю
        meals = db.query(MealPhoto).filter(
            MealPhoto.user_id == current_user.id,
            MealPhoto.created_at >= week_start,
            MealPhoto.created_at < week_end,
            MealPhoto.meal_name.isnot(None)
        ).all()
        
        if len(meals) >= 3:  # Минимум 3 приема пищи для статистики
            total_calories = sum(m.calories or 0 for m in meals)
            days_with_meals = len(set(m.created_at.date() for m in meals))
            average_calories = total_calories / days_with_meals if days_with_meals > 0 else 0
            
            period_name = ["this_week", "last_week", "2_weeks_ago", "3_weeks_ago"][week_offset]
            calorie_stats_list.append(CalorieStats(
                period=period_name,
                average_calories=round(average_calories, 1),
                average_consumed=round(average_calories, 1),
                status="ok"
            ))
        else:
            period_name = ["this_week", "last_week", "2_weeks_ago", "3_weeks_ago"][week_offset]
            calorie_stats_list.append(CalorieStats(
                period=period_name,
                average_calories=None,
                average_consumed=None,
                status="insufficient_data"
            ))
    
    # Изменения расхода энергии
    energy_changes = []
    periods = [("3_days", 3), ("7_days", 7), ("14_days", 14), ("30_days", 30), ("90_days", 90)]
    
    for period_name, days in periods:
        start_date = now - timedelta(days=days)
        meals = db.query(MealPhoto).filter(
            MealPhoto.user_id == current_user.id,
            MealPhoto.created_at >= start_date,
            MealPhoto.meal_name.isnot(None)
        ).all()
        
        if len(meals) >= 3:
            energy_changes.append(EnergyChange(
                period=period_name,
                change_calories=None,
                status="waiting"
            ))
        else:
            energy_changes.append(EnergyChange(
                period=period_name,
                change_calories=None,
                status="insufficient_data"
            ))
    
    # Вычисляем BMI
    onboarding = db.query(OnboardingData).filter(OnboardingData.user_id == current_user.id).first()
    bmi = None
    bmi_category = None
    
    if onboarding and onboarding.weight and onboarding.height:
        height_m = onboarding.height / 100  # см в метры
        bmi = onboarding.weight / (height_m ** 2)
        bmi = round(bmi, 1)
        
        if bmi < 18.5:
            bmi_category = "underweight"
        elif bmi < 25:
            bmi_category = "normal"
        elif bmi < 30:
            bmi_category = "overweight"
        else:
            bmi_category = "obese"
    
    return ProgressData(
        streak_count=streak_count,
        badges_count=badges_count,
        weight_stats=weight_stats,
        calorie_stats=calorie_stats_list,
        energy_changes=energy_changes,
        bmi=bmi,
        bmi_category=bmi_category
    )
