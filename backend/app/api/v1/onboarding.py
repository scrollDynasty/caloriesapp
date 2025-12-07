"""
Роуты для данных онбординга
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
    """Сохранить данные онбординга пользователя"""
    onboarding_data = create_or_update_onboarding_data(db, current_user.id, data)
    return onboarding_data


@router.get("", response_model=OnboardingDataResponse)
async def get_user_onboarding_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить данные онбординга пользователя"""
    data = get_onboarding_data(db, current_user.id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding data not found",
        )
    return data
