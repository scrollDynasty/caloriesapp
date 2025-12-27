from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"

class WorkoutFrequency(str, enum.Enum):
    LOW = "0-2"
    MEDIUM = "3-5"
    HIGH = "6+"

class Goal(str, enum.Enum):
    LOSE = "lose"
    MAINTAIN = "maintain"
    GAIN = "gain"

class DietType(str, enum.Enum):
    CLASSIC = "classic"
    PESCATARIAN = "pescatarian"
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"

class OnboardingData(Base):
    __tablename__ = "onboarding_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    gender = Column(Enum(Gender), nullable=True)
    
    user = relationship("User", backref="onboarding_data")

    workout_frequency = Column(Enum(WorkoutFrequency), nullable=True)

    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    target_weight = Column(Float, nullable=True)

    birth_date = Column(Date, nullable=True)
    
    step_goal = Column(Integer, nullable=True)

    has_trainer = Column(String(10), nullable=True)

    goal = Column(Enum(Goal), nullable=True)

    barrier = Column(String(100), nullable=True)

    diet_type = Column(Enum(DietType), nullable=True)

    motivation = Column(String(100), nullable=True)

    bmr = Column(Float, nullable=True)
    tdee = Column(Float, nullable=True)
    target_calories = Column(Float, nullable=True)

    protein_grams = Column(Float, nullable=True)
    protein_calories = Column(Float, nullable=True)
    protein_percentage = Column(Float, nullable=True)

    carbs_grams = Column(Float, nullable=True)
    carbs_calories = Column(Float, nullable=True)
    carbs_percentage = Column(Float, nullable=True)

    fats_grams = Column(Float, nullable=True)
    fats_calories = Column(Float, nullable=True)
    fats_percentage = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
