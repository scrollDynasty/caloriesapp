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
    
    fiber = Column(Integer, nullable=True)  
    sugar = Column(Integer, nullable=True)  
    sodium = Column(Integer, nullable=True) 
    health_score = Column(Integer, nullable=True) 
    ingredients_json = Column(Text, nullable=True)  

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="meal_photos")
