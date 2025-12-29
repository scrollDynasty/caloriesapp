from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.onboarding import OnboardingDataCreate, OnboardingDataResponse
from app.services.onboarding_service import get_onboarding_data, create_or_update_onboarding_data

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

@router.post("", response_model=OnboardingDataResponse)
async def save_onboarding_data(
    data: OnboardingDataCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import logging
    logger = logging.getLogger(__name__)
    
    data_dict = data.model_dump()
    logger.info(f"Saving onboarding data for user {current_user.id}: {data_dict}")
    
    onboarding_data = create_or_update_onboarding_data(db, current_user.id, data)
    
    logger.info(f"Onboarding data saved: id={onboarding_data.id}, user_id={onboarding_data.user_id}, height={onboarding_data.height}, weight={onboarding_data.weight}, gender={onboarding_data.gender}")
    
    return onboarding_data

@router.get("", response_model=Optional[OnboardingDataResponse])
async def get_user_onboarding_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = get_onboarding_data(db, current_user.id)
    return data
