import app.fastapi_patch

from fastapi import FastAPI
from fastapi_amis_admin.admin.settings import Settings as AdminSettings
from fastapi_amis_admin.admin.site import AdminSite
from fastapi_amis_admin.admin import admin
from fastapi_amis_admin.utils.pydantic import model_fields as original_model_fields
from pydantic import BaseModel, field_serializer
from typing import Optional, Any
from datetime import datetime, date
from sqlalchemy.inspection import inspect as sqlalchemy_inspect

from app.core.config import settings
from app.models.user import User
from app.models.onboarding_data import OnboardingData, Gender, WorkoutFrequency, Goal, DietType
from app.models.meal_photo import MealPhoto
from app.models.water_log import WaterLog
from app.models.weight_log import WeightLog
from app.models.progress_photo import ProgressPhoto


def patched_model_fields(model):
    if hasattr(model, 'model_fields'):
        return original_model_fields(model)
    
    if hasattr(model, '__table__'):
        mapper = sqlalchemy_inspect(model)
        fields = {}
        for column in mapper.columns:
            fields[column.name] = {
                'name': column.name,
                'type': column.type.python_type if hasattr(column.type, 'python_type') else str,
                'required': not column.nullable and column.default is None,
            }
        return fields
    
    # Fallback на оригинальную функцию
    return original_model_fields(model)


# Применяем патч
import fastapi_amis_admin.utils.pydantic as pydantic_utils
pydantic_utils.model_fields = patched_model_fields


admin_settings = AdminSettings(
    database_url_async=f"mysql+aiomysql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}?charset=utf8mb4",
    debug=settings.debug,
    site_title="Yeb-Ich Admin Panel",
    site_icon="https://img.icons8.com/fluency/48/vegetarian-food.png",
    language="en_US",
    amis_cdn="https://unpkg.com",
    amis_pkg="amis@6.3.0",
    amis_theme="antd",
    engine_options={
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "echo": False,
    },
)

site = AdminSite(settings=admin_settings)


class UserReadSchema(BaseModel):
    id: int
    email: Optional[str] = None
    apple_id: Optional[str] = None
    google_id: Optional[str] = None
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    streak_count: Optional[int] = None
    last_streak_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @field_serializer('last_streak_date', 'created_at', 'updated_at', when_used='json')
    def serialize_datetime(self, value: Optional[datetime], _info) -> Optional[str]:
        """Сериализуем datetime в ISO формат для JSON"""
        if value is None:
            return None
        return value.isoformat()
    
    def dict(self, **kwargs) -> dict[str, Any]:
        """Переопределяем dict() для совместимости со старым API библиотеки"""
        return self.model_dump(mode='json', **kwargs)
    
    class Config:
        from_attributes = True

class UserUpdateSchema(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    streak_count: Optional[int] = None
    last_streak_date: Optional[str] = None


# Pydantic схемы для OnboardingData
class OnboardingDataReadSchema(BaseModel):
    id: int
    user_id: int
    gender: Optional[str] = None
    workout_frequency: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    target_weight: Optional[float] = None
    birth_date: Optional[date] = None
    step_goal: Optional[int] = None
    has_trainer: Optional[str] = None
    goal: Optional[str] = None
    barrier: Optional[str] = None
    diet_type: Optional[str] = None
    motivation: Optional[str] = None
    bmr: Optional[float] = None
    tdee: Optional[float] = None
    target_calories: Optional[float] = None
    protein_grams: Optional[float] = None
    protein_calories: Optional[float] = None
    protein_percentage: Optional[float] = None
    carbs_grams: Optional[float] = None
    carbs_calories: Optional[float] = None
    carbs_percentage: Optional[float] = None
    fats_grams: Optional[float] = None
    fats_calories: Optional[float] = None
    fats_percentage: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @field_serializer('birth_date', when_used='json')
    def serialize_date(self, value: Optional[date], _info) -> Optional[str]:
        """Сериализуем date в ISO формат для JSON"""
        if value is None:
            return None
        return value.isoformat()
    
    @field_serializer('created_at', 'updated_at', when_used='json')
    def serialize_datetime(self, value: Optional[datetime], _info) -> Optional[str]:
        """Сериализуем datetime в ISO формат для JSON"""
        if value is None:
            return None
        return value.isoformat()
    
    def dict(self, **kwargs) -> dict[str, Any]:
        """Переопределяем dict() для совместимости со старым API библиотеки"""
        return self.model_dump(mode='json', **kwargs)
    
    class Config:
        from_attributes = True


@site.register_admin
class UserAdmin(admin.ModelAdmin):
    page_schema = "Users"
    model = User
    schema_read = UserReadSchema
    update_schema = UserUpdateSchema
    
    list_display = [
        User.id,
        User.email,
        User.username,
        User.first_name, 
        User.last_name,
        User.avatar_url,
        User.google_id,
        User.streak_count,
        User.created_at,
    ]
    
    search_fields = [User.email, User.username, User.first_name, User.last_name, User.google_id]
    
    form_excluded = [User.id, User.created_at, User.updated_at, User.apple_id, User.google_id]
    
    async def on_update_pre(self, request, data, item_id: int = None):
        if hasattr(data, 'model_dump'):
            data_dict = data.model_dump(exclude_unset=True)
        elif isinstance(data, dict):
            data_dict = data
        else:
            data_dict = dict(data) if hasattr(data, '__dict__') else {}
        
        if hasattr(self, 'update_schema') and self.update_schema:
            try:
                filtered = {k: v for k, v in data_dict.items() if v is not None}
                if filtered:
                    validated = self.update_schema(**filtered)
                    return validated.model_dump(exclude_unset=True)
                return {}
            except Exception:
                # Если валидация не прошла, возвращаем отфильтрованные данные
                return {k: v for k, v in data_dict.items() if v is not None}
        
        # Если схемы нет, просто фильтруем None
        return {k: v for k, v in data_dict.items() if v is not None}
    
    async def delete(self, request, item_id: int):
        from sqlalchemy import text
        
        db = self.site.db
        async with db.async_session_maker() as session:
            try:
                result = await session.execute(
                    text("DELETE FROM users WHERE id = :user_id").bindparams(user_id=item_id)
                )
                rows_deleted = result.rowcount
                await session.commit()
                return {"status": "success", "data": rows_deleted > 0}
            except Exception:
                await session.rollback()
                raise
    
    async def delete_item(self, request, item_id: int):
        return await self.delete(request, item_id)

@site.register_admin
class OnboardingDataAdmin(admin.ModelAdmin):
    page_schema = "Profiles"
    model = OnboardingData
    schema_read = OnboardingDataReadSchema
    
    list_display = [
        OnboardingData.id,
        OnboardingData.user_id, 
        OnboardingData.gender,
        OnboardingData.height,
        OnboardingData.weight,
        OnboardingData.target_weight,
        OnboardingData.goal,
        OnboardingData.target_calories,
        OnboardingData.created_at,
    ]
    
    search_fields = [OnboardingData.user_id]
    list_filter = [OnboardingData.user_id, OnboardingData.gender, OnboardingData.goal]
    link_model_fields = [OnboardingData.user_id]
    
    form_excluded = [OnboardingData.id, OnboardingData.created_at, OnboardingData.updated_at]


@site.register_admin
class MealPhotoAdmin(admin.ModelAdmin):
    page_schema = "Meals"
    model = MealPhoto
    
    list_display = [
        MealPhoto.id,
        MealPhoto.user_id,
        MealPhoto.meal_name,
        MealPhoto.detected_meal_name,
        MealPhoto.calories,
        MealPhoto.protein,
        MealPhoto.fat,
        MealPhoto.carbs,
        MealPhoto.created_at,
    ]
    
    search_fields = [MealPhoto.user_id, MealPhoto.meal_name, MealPhoto.detected_meal_name, MealPhoto.barcode]
    list_filter = [MealPhoto.user_id]
    link_model_fields = [MealPhoto.user_id]
    list_per_page = 50
    pk_admin_field = MealPhoto.id
    
    async def get_list_query(self, request):
        query = await super().get_list_query(request)
        return query.order_by(MealPhoto.created_at.desc())
    
    form_excluded = [MealPhoto.id, MealPhoto.created_at, MealPhoto.updated_at, MealPhoto.file_size, MealPhoto.mime_type]


@site.register_admin
class WaterLogAdmin(admin.ModelAdmin):
    page_schema = "Water Log"
    model = WaterLog
    
    list_display = [
        WaterLog.id,
        WaterLog.user_id,
        WaterLog.amount_ml,
        WaterLog.goal_ml,
        WaterLog.created_at,
    ]
    
    search_fields = [WaterLog.user_id]
    list_filter = [WaterLog.user_id]
    link_model_fields = [WaterLog.user_id]
    list_per_page = 50
    
    async def get_list_query(self, request):
        query = await super().get_list_query(request)
        return query.order_by(WaterLog.created_at.desc())
    
    form_excluded = [WaterLog.id, WaterLog.created_at]


@site.register_admin
class WeightLogAdmin(admin.ModelAdmin):
    page_schema = "Weight Log"
    model = WeightLog
    
    list_display = [
        WeightLog.id,
        WeightLog.user_id,
        WeightLog.weight,
        WeightLog.created_at,
    ]
    
    search_fields = [WeightLog.user_id]
    list_filter = [WeightLog.user_id]
    link_model_fields = [WeightLog.user_id]
    list_per_page = 50
    
    async def get_list_query(self, request):
        query = await super().get_list_query(request)
        return query.order_by(WeightLog.created_at.desc())
    
    form_excluded = [WeightLog.id, WeightLog.created_at]


@site.register_admin
class ProgressPhotoAdmin(admin.ModelAdmin):
    page_schema = "Progress Photos"
    model = ProgressPhoto
    
    list_display = [
        ProgressPhoto.id,
        ProgressPhoto.user_id,
        ProgressPhoto.file_name,
        ProgressPhoto.file_size,
        ProgressPhoto.created_at,
    ]
    
    search_fields = [ProgressPhoto.user_id, ProgressPhoto.file_name]
    list_filter = [ProgressPhoto.user_id]
    link_model_fields = [ProgressPhoto.user_id]
    list_per_page = 50
    
    async def get_list_query(self, request):
        query = await super().get_list_query(request)
        return query.order_by(ProgressPhoto.created_at.desc())
    
    form_excluded = [ProgressPhoto.id, ProgressPhoto.created_at, ProgressPhoto.file_size, ProgressPhoto.mime_type]
