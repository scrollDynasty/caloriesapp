"""
Модель пользователя
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    """Модель пользователя"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    apple_id = Column(String(255), unique=True, index=True, nullable=True)
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    name = Column(String(255), nullable=True)
    streak_count = Column(Integer, nullable=True)  # количество подряд выполненных дней
    # MySQL/MariaDB не поддерживает TZ для datetime, храним naive UTC
    last_streak_date = Column(DateTime(timezone=False), nullable=True)  # дата последнего выполненного дня (UTC)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
