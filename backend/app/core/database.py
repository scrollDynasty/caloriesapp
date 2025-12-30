from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Оптимизированные настройки connection pool
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,      
    pool_recycle=3600,        
    pool_size=10,           
    max_overflow=20,         
    pool_timeout=30,        
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import os
    from pathlib import Path
    from app.models.user import User
    from app.models.onboarding_data import OnboardingData
    from app.models.meal_photo import MealPhoto
    from app.models.water_log import WaterLog
    from app.models.recipe import Recipe
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        inspector = inspect(conn)
        
        tables = inspector.get_table_names()
        if "recipes" not in tables:
            Recipe.__table__.create(bind=engine, checkfirst=True)
            print("Таблица recipes создана")
        
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
        if "fiber" not in columns:
            alters.append("ADD COLUMN fiber INT NULL")
        if "sugar" not in columns:
            alters.append("ADD COLUMN sugar INT NULL")
        if "sodium" not in columns:
            alters.append("ADD COLUMN sodium INT NULL")
        if "health_score" not in columns:
            alters.append("ADD COLUMN health_score INT NULL")
        if "ingredients_json" not in columns:
            alters.append("ADD COLUMN ingredients_json TEXT NULL")
        if "recipe_id" not in columns:
            alters.append("ADD COLUMN recipe_id INT NULL")
        if alters:
            sql = "ALTER TABLE meal_photos " + ", ".join(alters)
            if all("ADD COLUMN" in alter.upper() for alter in alters):
                conn.execute(text(sql))
            else:
                raise ValueError("Unsafe SQL operation detected")

        user_columns = {col["name"] for col in inspector.get_columns("users")}
        user_alters = []
        if "streak_count" not in user_columns:
            user_alters.append("ADD COLUMN streak_count INT NULL")
        if "last_streak_date" not in user_columns:
            user_alters.append("ADD COLUMN last_streak_date DATETIME NULL")
        if user_alters:
            if all("ADD COLUMN" in alter.upper() for alter in user_alters):
                sql_users = "ALTER TABLE users " + ", ".join(user_alters)
                conn.execute(text(sql_users))
            else:
                raise ValueError("Unsafe SQL operation detected")
