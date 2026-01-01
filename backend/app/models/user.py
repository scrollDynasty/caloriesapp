from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    apple_id = Column(String(255), unique=True, index=True, nullable=True)
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    
    name = Column(String(255), nullable=True)  
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    username = Column(String(50), unique=True, index=True, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    streak_count = Column(Integer, nullable=True)
    last_streak_date = Column(DateTime(timezone=False), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
