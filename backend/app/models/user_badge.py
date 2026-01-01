from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class BadgeCategory(str, enum.Enum):
    STREAK = "streak"
    ACTIVITY = "activity"
    NUTRITION = "nutrition"
    SPECIAL = "special"


class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(String(50), nullable=False, index=True)
    category = Column(String(20), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    seen = Column(Boolean, server_default="0", default=False)
    notified = Column(Boolean, server_default="0", default=False)
    
    user = relationship("User", back_populates="badges")

    __table_args__ = (
        {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_unicode_ci"},
    )

