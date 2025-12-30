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
from app.models.recipe import Recipe
from app.models.press_inquiry import PressInquiry, InquiryStatus


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
    
    return original_model_fields(model)


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
        if value is None:
            return None
        return value.isoformat()
    
    def dict(self, **kwargs) -> dict[str, Any]:
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
        if value is None:
            return None
        return value.isoformat()
    
    @field_serializer('created_at', 'updated_at', when_used='json')
    def serialize_datetime(self, value: Optional[datetime], _info) -> Optional[str]:
        if value is None:
            return None
        return value.isoformat()
    
    def dict(self, **kwargs) -> dict[str, Any]:
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
                return {k: v for k, v in data_dict.items() if v is not None}
        
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
        MealPhoto.fiber,
        MealPhoto.sugar,
        MealPhoto.sodium,
        MealPhoto.health_score,
        MealPhoto.recipe_id,
        MealPhoto.created_at,
    ]
    
    search_fields = [MealPhoto.user_id, MealPhoto.meal_name, MealPhoto.detected_meal_name, MealPhoto.barcode]
    list_filter = [MealPhoto.user_id, MealPhoto.recipe_id]
    link_model_fields = [MealPhoto.user_id, MealPhoto.recipe_id]
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


class RecipeReadSchema(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    calories: int
    protein: int
    fat: int
    carbs: int
    fiber: Optional[int] = None
    sugar: Optional[int] = None
    sodium: Optional[int] = None
    health_score: Optional[int] = None
    time_minutes: Optional[int] = None
    difficulty: Optional[str] = None
    meal_type: Optional[str] = None
    ingredients_json: str
    instructions_json: str
    created_by_user_id: Optional[int] = None
    is_ai_generated: Optional[int] = None
    usage_count: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @field_serializer('created_at', 'updated_at', when_used='json')
    def serialize_datetime(self, value: Optional[datetime], _info) -> Optional[str]:
        if value is None:
            return None
        return value.isoformat()
    
    def dict(self, **kwargs) -> dict[str, Any]:
        return self.model_dump(mode='json', **kwargs)
    
    class Config:
        from_attributes = True


class RecipeUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    calories: Optional[int] = None
    protein: Optional[int] = None
    fat: Optional[int] = None
    carbs: Optional[int] = None
    fiber: Optional[int] = None
    sugar: Optional[int] = None
    sodium: Optional[int] = None
    health_score: Optional[int] = None
    time_minutes: Optional[int] = None
    difficulty: Optional[str] = None
    meal_type: Optional[str] = None
    ingredients_json: Optional[str] = None
    instructions_json: Optional[str] = None
    created_by_user_id: Optional[int] = None
    is_ai_generated: Optional[int] = None
    usage_count: Optional[int] = None


@site.register_admin
class RecipeAdmin(admin.ModelAdmin):
    page_schema = "Recipes"
    model = Recipe
    schema_read = RecipeReadSchema
    update_schema = RecipeUpdateSchema
    
    list_display = [
        Recipe.id,
        Recipe.name,
        Recipe.meal_type,
        Recipe.difficulty,
        Recipe.usage_count,
        Recipe.calories,
        Recipe.protein,
        Recipe.fat,
        Recipe.carbs,
        Recipe.fiber,
        Recipe.sugar,
        Recipe.sodium,
        Recipe.health_score,
        Recipe.is_ai_generated,
        Recipe.time_minutes,
        Recipe.created_at,
    ]
    
    search_fields = [Recipe.name, Recipe.meal_type, Recipe.difficulty]
    list_filter = [
        Recipe.meal_type, 
        Recipe.difficulty, 
        Recipe.is_ai_generated,
        Recipe.usage_count,
    ]
    
    link_model_fields = [Recipe.created_by_user_id]
    list_per_page = 50
    pk_admin_field = Recipe.id
    
    @property
    def list_display_links(self):
        return [Recipe.name]
    
    async def get_list_query(self, request):
        query = await super().get_list_query(request)
        
        popularity_filter = request.query_params.get('popularity')
        if popularity_filter == "very_popular":
            query = query.filter(Recipe.usage_count >= 5)
        elif popularity_filter == "popular":
            query = query.filter(Recipe.usage_count >= 3).filter(Recipe.usage_count < 5)
        elif popularity_filter == "rising":
            query = query.filter(Recipe.usage_count == 2)
        elif popularity_filter == "new":
            query = query.filter(Recipe.usage_count == 1)
        elif popularity_filter == "not_viewed":
            from sqlalchemy import or_
            query = query.filter(or_(Recipe.usage_count == 0, Recipe.usage_count == None))
        elif popularity_filter == "top":
            query = query.filter(Recipe.usage_count >= 5)
        elif popularity_filter == "bottom":
            query = query.filter(Recipe.usage_count <= 1)
        
        return query.order_by(Recipe.usage_count.desc(), Recipe.created_at.desc())
    
    form_excluded = [Recipe.id, Recipe.created_at, Recipe.updated_at]
    
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
                return {k: v for k, v in data_dict.items() if v is not None}
        
        return {k: v for k, v in data_dict.items() if v is not None}


class PressInquiryReadSchema(BaseModel):
    id: int
    email: str
    subject: str
    message: str
    status: InquiryStatus
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    admin_notes: Optional[str] = None
    replied_at: Optional[datetime] = None
    
    @field_serializer('created_at', 'updated_at', 'replied_at', when_used='json')
    def serialize_datetime(self, value: Optional[datetime], _info) -> Optional[str]:
        if value is None:
            return None
        return value.isoformat()
    
    def dict(self, **kwargs) -> dict[str, Any]:
        return self.model_dump(mode='json', **kwargs)
    
    class Config:
        from_attributes = True


@site.register_admin
class PressInquiryAdmin(admin.ModelAdmin):
    page_schema = "Press Inquiries"
    model = PressInquiry
    schema_read = PressInquiryReadSchema
    
    list_display = [
        PressInquiry.id,
        PressInquiry.email,
        PressInquiry.subject,
        PressInquiry.message,
        PressInquiry.status,
        PressInquiry.ip_address,
        PressInquiry.created_at,
        PressInquiry.updated_at,
    ]
    
    search_fields = [PressInquiry.email, PressInquiry.subject, PressInquiry.message]
    list_filter = [PressInquiry.status, PressInquiry.created_at]
    list_per_page = 50
    
    async def get_list_query(self, request):
        query = await super().get_list_query(request)
        return query.order_by(PressInquiry.created_at.desc())
    
    form_excluded = []
    
    async def get_form_item(self, request, modelfield, action: str = None):
        if modelfield.name == "id":
            return {
                "type": "input-text",
                "readOnly": True,
                "disabled": True,
            }
        if modelfield.name == "message":
            return {
                "type": "textarea",
                "rows": 12,
                "maxLength": 5000,
                "readOnly": action == "read",
                "disabled": action == "read",
            }
        if modelfield.name == "email" or modelfield.name == "subject":
            return {
                "type": "input-text",
                "readOnly": True,
                "disabled": True,
            }
        if modelfield.name == "status":
            return {
                "type": "select",
                "options": [
                    {"label": "Pending", "value": "pending"},
                    {"label": "Read", "value": "read"},
                    {"label": "Replied", "value": "replied"},
                    {"label": "Archived", "value": "archived"},
                ],
                "readOnly": action == "read",
                "disabled": action == "read",
            }
        if modelfield.name == "ip_address" or modelfield.name == "user_agent":
            return {
                "type": "input-text",
                "readOnly": True,
                "disabled": True,
            }
        if modelfield.name == "created_at" or modelfield.name == "updated_at" or modelfield.name == "replied_at":
            return {
                "type": "input-datetime",
                "readOnly": True,
                "disabled": True,
            }
        if modelfield.name == "admin_notes":
            return {
                "type": "textarea",
                "rows": 6,
                "maxLength": 2000,
                "readOnly": action == "read",
                "disabled": action == "read",
            }
        return await super().get_form_item(request, modelfield, action)
