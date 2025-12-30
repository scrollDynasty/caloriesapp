from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class InquiryStatus(str, enum.Enum):
    PENDING = "pending"
    READ = "read"
    REPLIED = "replied"
    ARCHIVED = "archived"


class PressInquiry(Base):
    __tablename__ = "press_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    subject = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(SQLEnum("pending", "read", "replied", "archived", name="inquirystatus"), default="pending", nullable=False, index=True)
    
    ip_address = Column(String(45), nullable=True, index=True)
    user_agent = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
        
    admin_notes = Column(Text, nullable=True)
    replied_at = Column(DateTime(timezone=True), nullable=True)

