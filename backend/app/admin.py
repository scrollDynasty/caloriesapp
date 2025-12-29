import app.fastapi_patch

from fastapi import FastAPI
from fastapi_amis_admin.admin.settings import Settings as AdminSettings
from fastapi_amis_admin.admin.site import AdminSite
from fastapi_amis_admin.admin import admin

from app.core.config import settings
from app.models.user import User
from app.models.onboarding_data import OnboardingData
from app.models.meal_photo import MealPhoto
from app.models.water_log import WaterLog
from app.models.weight_log import WeightLog
from app.models.progress_photo import ProgressPhoto


admin_settings = AdminSettings(
    database_url_async=f"mysql+aiomysql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}?charset=utf8mb4",
    debug=settings.debug,
    site_title="Yeb-Ich Admin Panel",
    site_icon="https://img.icons8.com/fluency/48/vegetarian-food.png",
    language="en_US",
    amis_cdn="https://unpkg.com",
    amis_pkg="amis@6.3.0",
    amis_theme="antd",
)

site = AdminSite(settings=admin_settings)


@site.register_admin
class UserAdmin(admin.ModelAdmin):
    page_schema = "Users"
    model = User
    
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


@site.register_admin
class OnboardingDataAdmin(admin.ModelAdmin):
    page_schema = "Profiles"
    model = OnboardingData
    
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
