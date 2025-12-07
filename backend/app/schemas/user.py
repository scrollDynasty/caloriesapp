"""
Схемы для пользователя
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
