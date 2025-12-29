import logging
from sqlalchemy.orm import Session
from app.models.onboarding_data import OnboardingData
from app.schemas.onboarding import OnboardingDataCreate

logger = logging.getLogger(__name__)

def get_onboarding_data(db: Session, user_id: int) -> OnboardingData | None:
    return db.query(OnboardingData).filter(OnboardingData.user_id == user_id).first()


def create_or_update_onboarding_data(
    db: Session, user_id: int, data: OnboardingDataCreate
) -> OnboardingData:
    existing_data = get_onboarding_data(db, user_id)

    if existing_data:
        logger.info(f"Updating existing onboarding data for user {user_id}")
        update_data = data.model_dump(exclude_unset=True)
        logger.info(f"Update data: {update_data}")
        for field, value in update_data.items():
            setattr(existing_data, field, value)
        
        db.commit()
        db.refresh(existing_data)
        logger.info(f"Updated: height={existing_data.height}, weight={existing_data.weight}, gender={existing_data.gender}")
        return existing_data
    else:
        logger.info(f"Creating new onboarding data for user {user_id}")
        onboarding_data_dict = data.model_dump()
        logger.info(f"Data dict: {onboarding_data_dict}")
        onboarding_data = OnboardingData(
            user_id=user_id,
            **onboarding_data_dict,
        )
        db.add(onboarding_data)
        db.commit()
        db.refresh(onboarding_data)
        logger.info(f"Created: id={onboarding_data.id}, height={onboarding_data.height}, weight={onboarding_data.weight}, gender={onboarding_data.gender}")
        return onboarding_data
