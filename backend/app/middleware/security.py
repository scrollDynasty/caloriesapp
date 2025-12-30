"""
Security middleware для защиты от различных атак
"""
import time
import logging
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.core.security import log_security_event, validate_cors_origin, get_remote_address
from app.core.config import settings

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Добавление security headers"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        path = str(request.url.path)
        if path.startswith("/admin"):
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; "
                "style-src 'self' 'unsafe-inline' https://unpkg.com; "
                "img-src 'self' data: https://img.icons8.com https://*.icons8.com; "
                "font-src 'self' data: https://unpkg.com; "
                "connect-src 'self'; "
                "frame-ancestors 'none'"
            )
        else:
            csp = (
                "default-src 'self'; "
                "script-src 'none'; "
                "style-src 'none'; "
                "img-src 'self' data:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "frame-ancestors 'none'"
            )
        
        response.headers["Content-Security-Policy"] = csp
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Удаляем информацию о сервере
        if "server" in response.headers:
            del response.headers["server"]
        
        return response

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Валидация входящих запросов"""
    
    MAX_REQUEST_SIZE = 20 * 1024 * 1024  # 20 MB
    MAX_HEADER_SIZE = 8192  # 8 KB
    
    async def dispatch(self, request: Request, call_next):
        # Проверка размера заголовков
        total_header_size = sum(len(k) + len(v) for k, v in request.headers.items())
        if total_header_size > self.MAX_HEADER_SIZE:
            log_security_event("oversized_headers", {
                "size": total_header_size,
                "path": str(request.url.path)
            }, request)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Request headers too large"
            )
        
        # Проверка пути на path traversal
        path = str(request.url.path)
        if ".." in path or "//" in path:
            log_security_event("path_traversal_attempt", {
                "path": path
            }, request)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid path"
            )
        
        response = await call_next(request)
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Простой rate limiting (для production лучше использовать Redis)"""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = {}  # В production использовать Redis
    
    async def dispatch(self, request: Request, call_next):
        if request.url.path in ["/health", "/"]:
            return await call_next(request)
        
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        minute_ago = current_time - 60
        
        self.request_counts = {
            ip: (count, timestamp) for ip, (count, timestamp) in self.request_counts.items()
            if timestamp > minute_ago
        }
        
        if client_ip in self.request_counts:
            count, timestamp = self.request_counts[client_ip]
            if timestamp > minute_ago:
                if count >= self.requests_per_minute:
                    log_security_event("rate_limit_exceeded", {
                        "ip": client_ip,
                        "path": str(request.url.path)
                    }, request)
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests"
                    )
                self.request_counts[client_ip] = (count + 1, timestamp)
            else:
                self.request_counts[client_ip] = (1, current_time)
        else:
            self.request_counts[client_ip] = (1, current_time)
        
        response = await call_next(request)
        return response

