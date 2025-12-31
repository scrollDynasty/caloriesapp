from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class WaterCreate(BaseModel):
    amount_ml: int = Field(..., ge=1, description="Water volume in ml")
    goal_ml: Optional[int] = Field(default=None, ge=0, description="Water goal in ml")
    created_at: Optional[datetime] = Field(default=None, description="Entry time (UTC or with timezone)")

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
