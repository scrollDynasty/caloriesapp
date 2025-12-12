from typing import Optional
from google.auth.transport import requests
from google.oauth2 import id_token
from app.core.config import settings

async def verify_google_token(token: str) -> Optional[dict]:
    try:
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), settings.google_client_id
        )
        return {
            "sub": idinfo.get("sub"),
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
        }
    except Exception:
        return None

async def verify_apple_token(token: str) -> Optional[dict]:

    return None
