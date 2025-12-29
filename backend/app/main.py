# Импортируем патч для совместимости ДО импорта админ-панели
import app.fastapi_patch  # noqa: F401

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, engine, Base
from app.api.v1 import auth, onboarding, meals, progress

app = FastAPI(
    title="Calories App API",
    description="API для приложения подсчета калорий",
    version="1.0.0",
)

# Пытаемся подключить админ-панель, но не падаем если она не работает
admin_enabled = False
try:
    from app.admin import site
    site.mount_app(app)
    admin_enabled = True
except Exception as e:
    print(f"Warning: Admin panel could not be loaded: {e}")
    admin_enabled = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=3600,
)

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return {"message": "OK"}

app.include_router(auth.router, prefix="/api/v1")
app.include_router(onboarding.router, prefix="/api/v1")
app.include_router(meals.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1/progress", tags=["progress"])

@app.on_event("startup")
async def startup_event():
    init_db()
    print(f"Server starting on {settings.host}:{settings.port}")
    print(f"Environment: {settings.environment}")
    print(f"Database: {settings.db_name}@{settings.db_host}")
    if admin_enabled:
        print(f"Admin panel: http://{settings.host}:{settings.port}/admin/")
    else:
        print("Admin panel: disabled (compatibility issue)")


@app.on_event("shutdown")
async def shutdown_event():
    engine.dispose()
    print("Database connection pool disposed")

@app.get("/")
async def root():
    return {
        "message": "Calories App API",
        "version": "1.0.0",
        "environment": settings.environment,
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.head("/health")
async def health_head():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
