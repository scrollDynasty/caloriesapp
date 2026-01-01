from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class BadgeConfig(BaseModel):
    id: str
    emoji: str
    title: str
    description: str
    requirement: str
    color: str
    category: str


class UserBadgeResponse(BaseModel):
    id: int
    badge_id: str
    category: str
    earned_at: datetime
    seen: bool
    
    class Config:
        from_attributes = True


class BadgeWithStatus(BaseModel):
    badge_id: str
    emoji: str
    title: str
    description: str
    requirement: str
    color: str
    category: str
    is_earned: bool
    earned_at: Optional[datetime] = None
    seen: bool = False


class BadgesResponse(BaseModel):
    badges: List[BadgeWithStatus]
    total_earned: int
    total_badges: int
    new_badges: List[str]


class MarkBadgesSeenRequest(BaseModel):
    badge_ids: List[str]


class MarkBadgesSeenResponse(BaseModel):
    success: bool
    marked_count: int


class CheckBadgesResponse(BaseModel):
    new_badges: List[BadgeWithStatus]
    total_earned: int

