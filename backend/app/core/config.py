from pydantic_settings import BaseSettings
from typing import List
import os
import sys

class Settings(BaseSettings):

    environment: str = "production"
    debug: bool = False

    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "caloriesapp"

    host: str = "0.0.0.0"
    port: int = 8000

    api_domain: str = "https://api.yeb-ich.com"

    # CORS: в production только production домены
    cors_origins: str = "https://api.yeb-ich.com,https://yeb-ich.com,http://localhost:3000,http://localhost:8081,http://localhost:19006,http://127.0.0.1:8081,http://127.0.0.1:19006"

    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 43200  # 30 дней 

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "https://api.yeb-ich.com/api/v1/auth/google/callback"
    apple_client_id: str = ""
    apple_team_id: str = ""
    apple_key_id: str = ""
    apple_private_key_path: str = ""

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_timeout: int = 30

    yandex_storage_access_key: str = ""
    yandex_storage_secret_key: str = ""
    yandex_storage_bucket_name: str = "caloriesapp"
    yandex_storage_endpoint: str = "https://storage.yandexcloud.net"
    yandex_storage_region: str = "ru-central1"

    admin_username: str = "admin"
    admin_password: str = "19790102Ss.."
    
    # Rate limiting
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000
    
    # File upload limits
    max_file_size_mb: int = 10
    allowed_file_types: List[str] = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]

    @property
    def database_url(self) -> str:
        # Используем URL encoding для пароля
        from urllib.parse import quote_plus
        encoded_password = quote_plus(self.db_password)
        return f"mysql+pymysql://{self.db_user}:{encoded_password}@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"

    @property
    def cors_origins_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",")]
        # В production фильтруем localhost
        if self.environment == "production":
            origins = [o for o in origins if "localhost" not in o.lower() and "127.0.0.1" not in o]
        return origins
    
    def validate_security(self):
        """Валидация настроек безопасности"""
        errors = []
        
        # Проверка JWT secret
        if not self.jwt_secret_key or len(self.jwt_secret_key) < 32:
            errors.append("JWT_SECRET_KEY должен быть минимум 32 символа")
        
        if self.jwt_secret_key == "replace_me_with_secure_random_string_64_chars":
            errors.append("JWT_SECRET_KEY не должен быть дефолтным значением")
        
        # Проверка debug режима в production
        if self.environment == "production" and self.debug:
            errors.append("DEBUG не должен быть включен в production")
        
        # Проверка admin credentials
        if self.admin_password == "admin123":
            errors.append("ADMIN_PASSWORD не должен быть дефолтным")
        
        if errors:
            error_msg = "Ошибки конфигурации безопасности:\n" + "\n".join(f"  - {e}" for e in errors)
            if self.environment == "production":
                raise ValueError(error_msg)
            else:
                import warnings
                warnings.warn(error_msg)

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

# Валидация при загрузке (только предупреждение в dev, ошибка в production)
try:
    settings.validate_security()
except ValueError as e:
    if settings.environment == "production":
        print(f"КРИТИЧЕСКАЯ ОШИБКА БЕЗОПАСНОСТИ: {e}", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"Предупреждение безопасности: {e}")
