from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class WeightLogCreate(BaseModel):
    weight: float
    created_at: Optional[datetime] = None


class WeightLogResponse(BaseModel):
    id: int
    user_id: int
    weight: float
    created_at: datetime

    class Config:
        from_attributes = True


class WeightChange(BaseModel):
    period: str 
    change_kg: Optional[float] = None
    status: str  


class WeightStats(BaseModel):
    current_weight: Optional[float] = None
    target_weight: Optional[float] = None
    start_weight: Optional[float] = None
    total_change: Optional[float] = None
    target_calories: Optional[int] = None
    changes: List[WeightChange]
    history: List[WeightLogResponse]


class ProgressPhotoUploadResponse(BaseModel):
    id: int
    file_name: str
    url: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProgressPhotoResponse(BaseModel):
    id: int
    user_id: int
    file_path: str
    file_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class CalorieStats(BaseModel):
    period: str
    average_calories: Optional[float] = None
    average_consumed: Optional[float] = None
    status: str


class EnergyChange(BaseModel):
    period: str
    change_calories: Optional[float] = None
    status: str


class ProgressData(BaseModel):
    streak_count: int
    badges_count: int
    weight_stats: WeightStats
    calorie_stats: List[CalorieStats]
    energy_changes: List[EnergyChange]
    bmi: Optional[float] = None
    bmi_category: Optional[str] = None
