from typing import Optional
from sqlalchemy.orm import Session
from app.models.onboarding_data import OnboardingData
from app.schemas.onboarding import OnboardingDataCreate


def get_onboarding_data(db: Session, user_id: int) -> Optional[OnboardingData]:
    return db.query(OnboardingData).filter(OnboardingData.user_id == user_id).first()


def create_or_update_onboarding_data(
    db: Session, 
    user_id: int, 
    data: OnboardingDataCreate
) -> OnboardingData:
    existing = get_onboarding_data(db, user_id)

    if existing:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(existing, field, value)
        
        db.commit()
        db.refresh(existing)
        return existing
    
    onboarding = OnboardingData(
        user_id=user_id,
        **data.model_dump(),
    )
    db.add(onboarding)
    db.commit()
    db.refresh(onboarding)
    
    return onboarding
