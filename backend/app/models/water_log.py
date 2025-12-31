from sqlalchemy import Column, Integer, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from app.core.database import Base

class WaterLog(Base):
    __tablename__ = "water_logs"
    
    __table_args__ = (
        Index('ix_water_logs_user_date', 'user_id', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_ml = Column(Integer, nullable=False)
    goal_ml = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    user = relationship("User", backref=backref("water_logs", cascade="all, delete-orphan"))
