"""
Конфигурация приложения
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Environment
    environment: str = "production"
    debug: bool = False

    # Database
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "caloriesapp"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # API Domain (для продакшена)
    api_domain: str = "https://api.yeb-ich.com"

    # Добавлены различные порты для веб-версии Expo
    cors_origins: str = "https://api.yeb-ich.com,https://yeb-ich.com,http://localhost:3000,http://localhost:8081,http://localhost:19006,http://127.0.0.1:8081,http://127.0.0.1:19006"

    # JWT
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 43200  # 30 дней для мобильного приложения

    # OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "https://api.yeb-ich.com/api/v1/auth/google/callback"
    apple_client_id: str = ""
    apple_team_id: str = ""
    apple_key_id: str = ""
    apple_private_key_path: str = ""

    ai_nutrition_base_url: str = "https://router.huggingface.co/v1"
    ai_nutrition_model: str = "Qwen/Qwen2.5-VL-7B-Instruct"
    ai_nutrition_api_key: str = "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"
    ai_nutrition_timeout: int = 20  # seconds
    ai_nutrition_provider: str = "huggingface"  #

    @property
    def database_url(self) -> str:
        """URL для подключения к базе данных"""
        return f"mysql+pymysql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"

    @property
    def cors_origins_list(self) -> List[str]:
        """Список разрешенных CORS origins"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
