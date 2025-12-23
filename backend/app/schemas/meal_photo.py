from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MealPhotoBase(BaseModel):
    meal_name: Optional[str] = None
    barcode: Optional[str] = None
    detected_meal_name: Optional[str] = None
    calories: Optional[int] = None
    protein: Optional[int] = None
    fat: Optional[int] = None
    carbs: Optional[int] = None
    fiber: Optional[int] = None  # Клетчатка в граммах
    sugar: Optional[int] = None  # Сахар в граммах
    sodium: Optional[int] = None  # Натрий в мг

class MealPhotoCreate(MealPhotoBase):
    pass

class MealPhotoResponse(MealPhotoBase):
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
    photo: MealPhotoResponse
    url: str
