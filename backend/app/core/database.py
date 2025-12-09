"""
Настройка подключения к базе данных
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, inspect
from app.core.config import settings

# Создаем движок базы данных
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

# Создаем фабрику сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()


def get_db():
    """Dependency для получения сессии базы данных"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Инициализация базы данных - создание таблиц"""
    from app.models.user import User  # noqa: F401
    from app.models.onboarding_data import OnboardingData  # noqa: F401
    from app.models.meal_photo import MealPhoto  # noqa: F401
    from app.models.water_log import WaterLog  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Гарантируем наличие новых столбцов для MealPhoto (детектированные БЖУ)
    with engine.begin() as conn:
        inspector = inspect(conn)
        columns = {col["name"] for col in inspector.get_columns("meal_photos")}
        alters = []
        if "detected_meal_name" not in columns:
            alters.append("ADD COLUMN detected_meal_name VARCHAR(255) NULL")
        if "calories" not in columns:
            alters.append("ADD COLUMN calories INT NULL")
        if "protein" not in columns:
            alters.append("ADD COLUMN protein INT NULL")
        if "fat" not in columns:
            alters.append("ADD COLUMN fat INT NULL")
        if "carbs" not in columns:
            alters.append("ADD COLUMN carbs INT NULL")
        if alters:
            sql = "ALTER TABLE meal_photos " + ", ".join(alters)
            conn.execute(text(sql))
