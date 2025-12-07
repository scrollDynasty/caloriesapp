"""
Схемы для фотографий еды
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MealPhotoBase(BaseModel):
    """Базовая схема фотографии"""
    meal_name: Optional[str] = None
    barcode: Optional[str] = None


class MealPhotoCreate(MealPhotoBase):
    """Схема для создания фотографии"""
    pass


class MealPhotoResponse(MealPhotoBase):
    """Схема ответа с фотографией"""
    id: int
    user_id: int
    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MealPhotoUploadResponse(BaseModel):
    """Схема ответа после загрузки фотографии"""
    photo: MealPhotoResponse
    url: str  # Полный URL для доступа к фотографии
