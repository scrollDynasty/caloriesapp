"""
Модель данных онбординга
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"


class WorkoutFrequency(str, enum.Enum):
    LOW = "0-2"
    MEDIUM = "3-5"
    HIGH = "6+"


class Goal(str, enum.Enum):
    LOSE = "lose"
    MAINTAIN = "maintain"
    GAIN = "gain"


class DietType(str, enum.Enum):
    CLASSIC = "classic"
    PESCATARIAN = "pescatarian"
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"


class OnboardingData(Base):
    """Модель данных онбординга пользователя"""
    __tablename__ = "onboarding_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)

    # Шаг 1: Пол
    gender = Column(Enum(Gender), nullable=True)

    # Шаг 2: Количество тренировок
    workout_frequency = Column(Enum(WorkoutFrequency), nullable=True)

    # Шаг 3: Рост и вес
    height = Column(Float, nullable=True)  # в см
    weight = Column(Float, nullable=True)  # в кг

    # Шаг 4: Дата рождения
    birth_date = Column(Date, nullable=True)

    # Шаг 5: Работа с тренером
    has_trainer = Column(String(10), nullable=True)  # "true", "false" или null

    # Шаг 6: Цель
    goal = Column(Enum(Goal), nullable=True)

    # Шаг 7: Барьер
    barrier = Column(String(100), nullable=True)  # inconsistency, bad-habits, etc.

    # Шаг 8: Тип питания
    diet_type = Column(Enum(DietType), nullable=True)

    # Шаг 9: Мотивация
    motivation = Column(String(100), nullable=True)  # eat-healthy, boost-energy, etc.

    # Рассчитанные данные
    bmr = Column(Float, nullable=True)  # Базовый метаболизм
    tdee = Column(Float, nullable=True)  # Общий расход энергии
    target_calories = Column(Float, nullable=True)  # Целевые калории

    # Макронутриенты
    protein_grams = Column(Float, nullable=True)
    protein_calories = Column(Float, nullable=True)
    protein_percentage = Column(Float, nullable=True)

    carbs_grams = Column(Float, nullable=True)
    carbs_calories = Column(Float, nullable=True)
    carbs_percentage = Column(Float, nullable=True)

    fats_grams = Column(Float, nullable=True)
    fats_calories = Column(Float, nullable=True)
    fats_percentage = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
