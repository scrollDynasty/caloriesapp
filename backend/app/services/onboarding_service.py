"""
Сервис для работы с данными онбординга
"""
from sqlalchemy.orm import Session
from app.models.onboarding_data import OnboardingData
from app.schemas.onboarding import OnboardingDataCreate


def get_onboarding_data(db: Session, user_id: int) -> OnboardingData | None:
    """Получить данные онбординга пользователя"""
    return db.query(OnboardingData).filter(OnboardingData.user_id == user_id).first()


def create_or_update_onboarding_data(
    db: Session, user_id: int, data: OnboardingDataCreate
) -> OnboardingData:
    """Создать или обновить данные онбординга"""
    existing_data = get_onboarding_data(db, user_id)

    if existing_data:
        # Обновляем существующие данные
        for key, value in data.dict(exclude_unset=True).items():
            setattr(existing_data, key, value)
        db.commit()
        db.refresh(existing_data)
        return existing_data
    else:
        # Создаем новые данные
        onboarding_data = OnboardingData(
            user_id=user_id,
            **data.dict(exclude_unset=True),
        )
        db.add(onboarding_data)
        db.commit()
        db.refresh(onboarding_data)
        return onboarding_data
