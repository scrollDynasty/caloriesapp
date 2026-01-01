import app.fastapi_patch

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import init_db, engine
from app.api.v1 import auth, onboarding, meals, progress, press, badges
from app.middleware.security import SecurityHeadersMiddleware, RequestValidationMiddleware, RateLimitMiddleware

app = FastAPI(
    title="Calories App API",
    description="Calories tracking application API",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

try:
    from app.admin import site
    site.mount_app(app)
except Exception:
    pass

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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
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
app.include_router(badges.router, prefix="/api/v1/badges", tags=["badges"])

@app.on_event("startup")
async def startup_event():
    init_db()

@app.on_event("shutdown")
async def shutdown_event():
    engine.dispose()

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
