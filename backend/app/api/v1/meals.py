"""
API endpoints для работы с фотографиями еды
"""
import os
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.meal_photo import MealPhoto
from app.schemas.meal_photo import MealPhotoUploadResponse, MealPhotoResponse
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

_BACKEND_DIR = Path(__file__).parent.parent.parent.parent  # backend/
_PROJECT_ROOT = _BACKEND_DIR.parent  # Поднимаемся на уровень выше backend (корень проекта)
MEDIA_ROOT = _PROJECT_ROOT / "media" / "meal_photos"

# Создаем директорию, если её нет
try:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    logger.info(f"Media directory initialized at: {MEDIA_ROOT}")
except Exception as e:
    logger.error(f"Failed to create media directory at {MEDIA_ROOT}: {e}")
    raise

# Создаем поддиректории для каждого пользователя
def get_user_media_dir(user_id: int) -> Path:
    """Получить директорию для медиа файлов пользователя"""
    user_dir = MEDIA_ROOT / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


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
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть изображением"
        )
    
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
        
        # Создаем запись в БД
        meal_photo = MealPhoto(
            user_id=current_user.id,
            file_path=relative_path,
            file_name=file.filename or unique_filename,
            file_size=file_size,
            mime_type=file.content_type,
            barcode=barcode_value,
            meal_name=meal_name_value,
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Получить фотографию еды по ID
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
