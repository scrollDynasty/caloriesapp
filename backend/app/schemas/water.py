"\"\"\"\nСхемы для учёта воды\n\"\"\""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class WaterCreate(BaseModel):
    amount_ml: int = Field(..., ge=1, description="Объём воды в мл")
    goal_ml: Optional[int] = Field(default=None, ge=0, description="Цель по воде в мл")
    created_at: Optional[datetime] = Field(default=None, description="Время записи (UTC или с таймзоной)")

class WaterEntry(BaseModel):
    id: int
    amount_ml: int
    goal_ml: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class WaterDailyResponse(BaseModel):
    date: str
    total_ml: int
    goal_ml: Optional[int]
    entries: List[WaterEntry]
