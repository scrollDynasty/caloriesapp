from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class MealPhoto(Base):
    __tablename__ = "meal_photos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)

    barcode = Column(String(100), nullable=True, index=True)
    meal_name = Column(String(255), nullable=True)
    detected_meal_name = Column(String(255), nullable=True)

    calories = Column(Integer, nullable=True)
    protein = Column(Integer, nullable=True)
    fat = Column(Integer, nullable=True)
    carbs = Column(Integer, nullable=True)
    
    # Дополнительные нутриенты
    fiber = Column(Integer, nullable=True)  # Клетчатка в граммах
    sugar = Column(Integer, nullable=True)  # Сахар в граммах
    sodium = Column(Integer, nullable=True)  # Натрий в мг
    health_score = Column(Integer, nullable=True)  # Оценка здоровости 0-10 от нейросети\n    ingredients_json = Column(Text, nullable=True)  # JSON список ингредиентов

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="meal_photos")
