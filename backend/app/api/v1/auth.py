import httpx
import json
import logging
import time
from urllib.parse import urlencode, quote
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.schemas.auth import Token, GoogleAuthRequest, AppleAuthRequest
from app.schemas.user import UserResponse
from app.schemas.user import UserProfileUpdate, UserProfileResponse, UsernameCheckRequest, UsernameCheckResponse
from app.core.dependencies import get_current_user
from app.models.user import User
from app.utils.auth import create_access_token
from app.utils.oauth import verify_google_token, verify_apple_token
from app.services.user_service import get_or_create_user_by_google, get_or_create_user_by_apple

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])
_processed_codes: dict[str, float] = {}
_CODE_TTL_SECONDS = 120

@router.get("/google")
async def auth_google_initiate(state: str = Query(default="caloriesapp://auth/callback")):
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID in .env",
        )

    if settings.google_redirect_uri:
        redirect_uri = settings.google_redirect_uri
    else:

        if settings.host == "0.0.0.0":

            redirect_uri = f"http://localhost:{settings.port}/api/v1/auth/google/callback"
        else:
            redirect_uri = f"http://{settings.host}:{settings.port}/api/v1/auth/google/callback"

    logger.warning(f"Google OAuth: Using redirect_uri={redirect_uri}, state={state}")

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid profile email",
        "access_type": "offline",
        "prompt": "select_account",
        "state": state,
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url=auth_url)

@router.get("/google/callback")
async def auth_google_callback(
    code: str = Query(None),
    state: str = Query(default="caloriesapp://auth/callback"),
    error: str = Query(None),
    db: Session = Depends(get_db),
):
    if error:
        redirect_uri = state or "caloriesapp://auth/callback"
        return RedirectResponse(url=f"{redirect_uri}?error={error}")

    if not code:
        redirect_uri = state or "caloriesapp://auth/callback"
        return RedirectResponse(url=f"{redirect_uri}?error=no_code")

    now = time.time()

    for k, v in list(_processed_codes.items()):
        if now - v > _CODE_TTL_SECONDS:
            _processed_codes.pop(k, None)
    if code in _processed_codes:
        logger.warning("Google OAuth: repeated code usage detected, skipping.")
        redirect_uri = state or "caloriesapp://auth/callback"
        return RedirectResponse(url=f"{redirect_uri}?error=code_already_used")
    _processed_codes[code] = now

    try:
        if settings.google_redirect_uri:
            callback_redirect_uri = settings.google_redirect_uri
        else:
            if settings.host == "0.0.0.0":
                callback_redirect_uri = f"http://localhost:{settings.port}/api/v1/auth/google/callback"
            else:
                callback_redirect_uri = f"http://{settings.host}:{settings.port}/api/v1/auth/google/callback"

        logger.warning(f"Google OAuth callback: Using redirect_uri={callback_redirect_uri} for token exchange")

        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": callback_redirect_uri,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)

            if token_response.status_code == 400:
                error_data = token_response.json()
                error_description = error_data.get("error_description", "")
                error_code = error_data.get("error", "")

                logger.error(f"Google OAuth error: {error_code} - {error_description}")
                logger.error(f"Used redirect_uri: {callback_redirect_uri}")
                logger.error(f"Client ID: {settings.google_client_id[:20]}...")

                if "redirect_uri_mismatch" in error_description.lower() or error_code == "redirect_uri_mismatch":
                    redirect_uri = state or "caloriesapp://auth/callback"
                    error_msg = (
                        f"redirect_uri_mismatch: URI '{callback_redirect_uri}' не зарегистрирован. "
                        f"Добавьте этот URI в Google Cloud Console → Credentials → Authorized redirect URIs"
                    )

                    error_encoded = quote(error_msg)
                    return RedirectResponse(url=f"{redirect_uri}?error={error_encoded}")

            token_response.raise_for_status()
            tokens = token_response.json()
            id_token = tokens.get("id_token")

        if not id_token:
            redirect_uri = state or "caloriesapp://auth/callback"
            return RedirectResponse(url=f"{redirect_uri}?error=no_id_token")

        user_info = await verify_google_token(id_token)
        if not user_info:
            redirect_uri = state or "caloriesapp://auth/callback"
            return RedirectResponse(url=f"{redirect_uri}?error=invalid_token")

        user = get_or_create_user_by_google(
            db,
            google_id=user_info["sub"],
            email=user_info.get("email"),
            name=user_info.get("name"),
        )

        access_token = create_access_token(data={"sub": str(user.id)})

        user_data = {
            "user_id": user.id,
            "email": user.email,
            "name": user.name or "",
            "google_id": user.google_id,
        }

        redirect_uri = state or "caloriesapp://auth/callback"

        user_param = quote(json.dumps(user_data))
        callback_url = f"{redirect_uri}?token={access_token}&user={user_param}"

        logger.info(f"✅ OAuth successful! Redirecting to: {redirect_uri}")
        logger.info(f"📦 Token length: {len(access_token)}, User data keys: {list(user_data.keys())}")
        logger.info(f"🔗 Full callback URL: {callback_url}")

        return RedirectResponse(url=callback_url, status_code=302)

    except httpx.HTTPStatusError as e:

        redirect_uri = state or "caloriesapp://auth/callback"
        error_detail = ""
        if e.response.status_code == 400:
            try:
                error_data = e.response.json()
                error_detail = error_data.get("error_description", str(e))
            except:
                error_detail = str(e)
        else:
            error_detail = str(e)
        return RedirectResponse(url=f"{redirect_uri}?error={error_detail}")
    except Exception as e:
        redirect_uri = state or "caloriesapp://auth/callback"
        return RedirectResponse(url=f"{redirect_uri}?error={str(e)}")

@router.post("/google", response_model=Token)
async def auth_google_token(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    user_info = await verify_google_token(request.id_token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    user = get_or_create_user_by_google(
        db,
        google_id=user_info["sub"],
        email=user_info.get("email"),
        name=user_info.get("name"),
    )

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

@router.post("/apple", response_model=Token)
async def auth_apple(request: AppleAuthRequest, db: Session = Depends(get_db)):
    user_info = await verify_apple_token(request.id_token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Apple token",
        )

    user = get_or_create_user_by_apple(
        db,
        apple_id=user_info["sub"],
        email=user_info.get("email"),
        name=user_info.get("name"),
    )

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    return current_user


@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's profile"""
    import re
    
    # Validate username if provided
    if profile_data.username:
        username = profile_data.username.lower().strip()
        
        if not re.match(r'^[a-z0-9_]+$', username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username может содержать только латинские буквы, цифры и подчёркивания",
            )
        
        existing_user = db.query(User).filter(
            User.username == username,
            User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Это имя пользователя уже занято",
            )
        
        current_user.username = username
    
    if profile_data.first_name is not None:
        current_user.first_name = profile_data.first_name.strip()
    
    if profile_data.last_name is not None:
        current_user.last_name = profile_data.last_name.strip()
    
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/check-username", response_model=UsernameCheckResponse)
async def check_username_availability(
    request: UsernameCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check if a username is available"""
    import re
    
    username = request.username.lower().strip()
    
    if not re.match(r'^[a-z0-9_]+$', username):
        return UsernameCheckResponse(
            username=username,
            available=False,
            message="Username может содержать только латинские буквы, цифры и подчёркивания",
        )
    
    if len(username) < 3:
        return UsernameCheckResponse(
            username=username,
            available=False,
            message="Username должен быть минимум 3 символа",
        )
    
    existing_user = db.query(User).filter(
        User.username == username,
        User.id != current_user.id
    ).first()
    
    if existing_user:
        return UsernameCheckResponse(
            username=username,
            available=False,
            message="Это имя пользователя уже занято",
        )
    
    return UsernameCheckResponse(
        username=username,
        available=True,
        message="Имя пользователя доступно",
    )
