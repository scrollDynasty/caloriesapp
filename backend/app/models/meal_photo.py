"""
Модель фотографии еды
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class MealPhoto(Base):
    """Модель фотографии еды"""
    __tablename__ = "meal_photos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)  # Путь к файлу относительно /media
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # Размер файла в байтах
    mime_type = Column(String(100), nullable=False)  # image/jpeg, image/png и т.д.
    
    # Опциональные метаданные
    barcode = Column(String(100), nullable=True, index=True)  # Если фото было сделано через сканирование штрих-кода
    meal_name = Column(String(255), nullable=True)  # Название блюда (если указал пользователь)
    detected_meal_name = Column(String(255), nullable=True)  # Название блюда, распознанное моделью

    # Питательные показатели (из AI)
    calories = Column(Integer, nullable=True)  # ккал
    protein = Column(Integer, nullable=True)   # грамм
    fat = Column(Integer, nullable=True)       # грамм
    carbs = Column(Integer, nullable=True)     # грамм
    
    # Дата и время
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связь с пользователем
    user = relationship("User", backref="meal_photos")
