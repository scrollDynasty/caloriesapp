"""
FastAPI приложение - точка входа
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import auth, onboarding

app = FastAPI(
    title="Calories App API",
    description="API для приложения подсчета калорий",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=3600,
)

# Обработчик OPTIONS запросов для всех путей
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Обработчик для OPTIONS запросов (CORS preflight)"""
    return {"message": "OK"}

app.include_router(auth.router, prefix="/api/v1")
app.include_router(onboarding.router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Инициализация при запуске"""
    init_db()
    print(f"Server starting on {settings.host}:{settings.port}")
    print(f"Environment: {settings.environment}")
    print(f"Database: {settings.db_name}@{settings.db_host}")


@app.get("/")
async def root():
    """Корневой endpoint"""
    return {
        "message": "Calories App API",
        "version": "1.0.0",
        "environment": settings.environment,
    }


@app.get("/health")
async def health_check():
    """Проверка здоровья сервера"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
