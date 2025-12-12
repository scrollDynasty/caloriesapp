from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.onboarding_data import Gender, WorkoutFrequency, Goal, DietType

class OnboardingDataCreate(BaseModel):

    gender: Optional[Gender] = None

    workout_frequency: Optional[WorkoutFrequency] = None

    height: Optional[float] = None
    weight: Optional[float] = None

    birth_date: Optional[date] = None

    has_trainer: Optional[bool] = None

    goal: Optional[Goal] = None

    barrier: Optional[str] = None

    diet_type: Optional[DietType] = None

    motivation: Optional[str] = None

    bmr: Optional[float] = None
    tdee: Optional[float] = None
    target_calories: Optional[float] = None

    protein_grams: Optional[float] = None
    protein_calories: Optional[float] = None
    protein_percentage: Optional[float] = None

    carbs_grams: Optional[float] = None
    carbs_calories: Optional[float] = None
    carbs_percentage: Optional[float] = None

    fats_grams: Optional[float] = None
    fats_calories: Optional[float] = None
    fats_percentage: Optional[float] = None

class OnboardingDataResponse(BaseModel):
    id: int
    user_id: int
    gender: Optional[Gender] = None
    workout_frequency: Optional[WorkoutFrequency] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    birth_date: Optional[date] = None
    has_trainer: Optional[bool] = None
    goal: Optional[Goal] = None
    barrier: Optional[str] = None
    diet_type: Optional[DietType] = None
    motivation: Optional[str] = None
    bmr: Optional[float] = None
    tdee: Optional[float] = None
    target_calories: Optional[float] = None
    protein_grams: Optional[float] = None
    protein_calories: Optional[float] = None
    protein_percentage: Optional[float] = None
    carbs_grams: Optional[float] = None
    carbs_calories: Optional[float] = None
    carbs_percentage: Optional[float] = None
    fats_grams: Optional[float] = None
    fats_calories: Optional[float] = None
    fats_percentage: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
