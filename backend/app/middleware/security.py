import time
import logging
from collections import defaultdict
from threading import Lock
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.core.security import log_security_event, validate_cors_origin, get_remote_address
from app.core.config import settings

logger = logging.getLogger(__name__)

_rate_limit_lock = Lock()
_rate_limit_data = defaultdict(list)  # {ip: [timestamp1, timestamp2, ...]}
_last_cleanup = time.time()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    
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
        
        if "server" in response.headers:
            del response.headers["server"]
        
        return response

class RequestValidationMiddleware(BaseHTTPMiddleware):
    
    MAX_REQUEST_SIZE = 20 * 1024 * 1024
    MAX_HEADER_SIZE = 8192
    
    async def dispatch(self, request: Request, call_next):
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
    EXEMPT_PATHS = frozenset(["/health", "/", "/docs", "/redoc", "/openapi.json"])
    
    def _is_admin_path(self, path: str) -> bool:
        return path.startswith("/admin")
    
    CLEANUP_INTERVAL = 60
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_size = 60 
    
    def _cleanup_old_entries(self, current_time: float):
        global _last_cleanup, _rate_limit_data
        
        if current_time - _last_cleanup < self.CLEANUP_INTERVAL:
            return
        
        with _rate_limit_lock:
            cutoff = current_time - self.window_size
            for ip in list(_rate_limit_data.keys()):
                _rate_limit_data[ip] = [ts for ts in _rate_limit_data[ip] if ts > cutoff]
                if not _rate_limit_data[ip]:
                    del _rate_limit_data[ip]
            _last_cleanup = current_time
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in self.EXEMPT_PATHS or self._is_admin_path(path):
            return await call_next(request)
        
        client_ip = get_remote_address(request) or "unknown"
        current_time = time.time()
        cutoff = current_time - self.window_size
        
        self._cleanup_old_entries(current_time)
        
        with _rate_limit_lock:
            _rate_limit_data[client_ip] = [
                ts for ts in _rate_limit_data[client_ip] if ts > cutoff
            ]
            
            if len(_rate_limit_data[client_ip]) >= self.requests_per_minute:
                log_security_event("rate_limit_exceeded", {
                    "ip": client_ip,
                    "path": str(request.url.path),
                    "count": len(_rate_limit_data[client_ip])
                }, request)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                    headers={"Retry-After": "60"}
                )
            
            _rate_limit_data[client_ip].append(current_time)
        
        response = await call_next(request)
        return response

