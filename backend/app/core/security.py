import secrets
import hashlib
import hmac
from typing import Optional
from fastapi import HTTPException, status, Request
import logging

logger = logging.getLogger(__name__)

def validate_jwt_secret(secret_key: str) -> bool:
    if not secret_key or len(secret_key) < 32:
        return False
    if secret_key == "replace_me_with_secure_random_string_64_chars":
        return False
    return True

def generate_secure_secret(length: int = 64) -> str:
    return secrets.token_urlsafe(length)

def validate_file_content(file_content: bytes, expected_mime_type: str) -> bool:
    if not file_content or len(file_content) < 4:
        return False
    
    magic_bytes = {
        b'\xFF\xD8\xFF': 'image/jpeg',
        b'\x89PNG': 'image/png',
        b'RIFF': 'image/webp',  
        b'\x00\x00\x00\x18ftypheic': 'image/heic',
        b'\x00\x00\x00\x18ftypheif': 'image/heif',
    }
    
    if file_content[:3] == b'\xFF\xD8\xFF':
        return expected_mime_type in ['image/jpeg', 'image/jpg']
    
    if file_content[:4] == b'\x89PNG':
        return expected_mime_type == 'image/png'
    
    if file_content[:4] == b'RIFF' and b'WEBP' in file_content[:12]:
        return expected_mime_type == 'image/webp'
    
    if b'ftypheic' in file_content[:20] or b'ftypheif' in file_content[:20]:
        return expected_mime_type in ['image/heic', 'image/heif']
    
    return False

def sanitize_filename(filename: str) -> str:
    import re
    sanitized = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    if len(sanitized) > 255:
        sanitized = sanitized[:255]
    return sanitized

def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes

def get_remote_address(request: Optional[Request]) -> str:
    if not request:
        return "unknown"
    if request.client:
        return request.client.host
    return "unknown"

def log_security_event(event_type: str, details: dict, request: Optional[Request] = None):
    ip_address = get_remote_address(request) if request else "unknown"
    logger.warning(
        f"Security event: {event_type} | IP: {ip_address} | Details: {details}",
        extra={
            "event_type": event_type,
            "ip_address": ip_address,
            "details": details
        }
    )

def validate_cors_origin(origin: str, allowed_origins: list) -> bool:
    if not origin:
        return False
    
    from app.core.config import settings
    if settings.environment == "production":
        if "localhost" in origin.lower() or "127.0.0.1" in origin:
            return False
    
    return origin in allowed_origins

def get_remote_address_for_middleware(request: Request) -> str:
    return get_remote_address(request)

