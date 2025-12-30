from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    
    calories = Column(Integer, nullable=False)
    protein = Column(Integer, nullable=False)
    fat = Column(Integer, nullable=False)
    carbs = Column(Integer, nullable=False)
    fiber = Column(Integer, nullable=True)
    sugar = Column(Integer, nullable=True)
    sodium = Column(Integer, nullable=True)
    
    health_score = Column(Integer, nullable=True)
    
    time_minutes = Column(Integer, nullable=True)
    difficulty = Column(String(50), nullable=True)
    meal_type = Column(String(50), nullable=True, index=True)
    
    ingredients_json = Column(Text, nullable=False)
    instructions_json = Column(Text, nullable=False)
    
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    is_ai_generated = Column(Integer, default=1)
    usage_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    created_by = relationship("User", backref="created_recipes")

