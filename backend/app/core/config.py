from pydantic_settings import BaseSettings
from typing import List

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

    cors_origins: str = "https://api.yeb-ich.com,https://yeb-ich.com,http://localhost:3000,http://localhost:8081,http://localhost:19006,http://127.0.0.1:8081,http://127.0.0.1:19006"

    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 43200 

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
    admin_password: str = "admin123"

    @property
    def database_url(self) -> str:
        return f"mysql+pymysql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
