from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import re


class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    streak_count: Optional[int] = None
    created_at: datetime  

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=500)

    @classmethod
    def validate_username(cls, username: str) -> bool:
        if not username:
            return False
        pattern = r'^[a-z0-9_]+$'
        return bool(re.match(pattern, username.lower()))


class UserProfileResponse(BaseModel):
    id: int
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    streak_count: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UsernameCheckRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)


class UsernameCheckResponse(BaseModel):
    username: str
    available: bool
    message: str


class AvatarUploadResponse(BaseModel):
    avatar_url: str
    message: str
