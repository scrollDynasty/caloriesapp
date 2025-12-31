import app.fastapi_patch
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import init_db, engine
from app.api.v1 import auth, onboarding, meals, progress, press
from app.middleware.security import SecurityHeadersMiddleware, RequestValidationMiddleware, RateLimitMiddleware
from app.core.dependencies import get_current_user
from app.models.user import User
from sqlalchemy.orm import Session
from sqlalchemy import text

logging.basicConfig(
    level=logging.INFO if settings.environment == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Calories App API",
    description="API для приложения подсчета калорий",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

admin_enabled = False
try:
    from app.admin import site
    site.mount_app(app)
    admin_enabled = True
except Exception as e:
    print(f"Warning: Admin panel could not be loaded: {e}")
    admin_enabled = False

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestValidationMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.rate_limit_per_minute)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
        
    response = await call_next(request)
    
    process_time = time.time() - start_time
    if process_time > 1.0:
        logger.warning(
            f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s",
            extra={
                "method": request.method,
                "path": str(request.url.path),
                "process_time": process_time,
                "client_ip": request.client.host if request.client else "unknown"
            }
        )
    
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return {"message": "OK"}

app.include_router(auth.router, prefix="/api/v1")
app.include_router(onboarding.router, prefix="/api/v1")
app.include_router(meals.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1/progress", tags=["progress"])
app.include_router(press.router, prefix="/api/v1", tags=["press"])

@app.on_event("startup")
async def startup_event():
    init_db()
    print(f"Server starting on {settings.host}:{settings.port}")
    print(f"Environment: {settings.environment}")
    print(f"Database: {settings.db_name}@{settings.db_host}")
    if admin_enabled:
        print(f"Admin panel: http://{settings.host}:{settings.port}/admin/")
        print(f"Admin credentials: username={settings.admin_username}, password={settings.admin_password}")
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
