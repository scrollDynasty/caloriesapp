"""
Роуты для аутентификации
"""
import httpx
import json
import logging
from urllib.parse import urlencode, quote
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.schemas.auth import Token, GoogleAuthRequest, AppleAuthRequest
from app.schemas.user import UserResponse
from app.core.dependencies import get_current_user
from app.models.user import User
from app.utils.auth import create_access_token
from app.utils.oauth import verify_google_token, verify_apple_token
from app.services.user_service import get_or_create_user_by_google, get_or_create_user_by_apple

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google")
async def auth_google_initiate(state: str = Query(default="caloriesapp://auth/callback")):
    """Инициирует Google OAuth flow"""
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID in .env",
        )
    
    # Определяем redirect_uri (должен точно совпадать с тем, что в Google Cloud Console)
    # ВАЖНО: redirect_uri для Google OAuth должен быть HTTP/HTTPS URL, не exp:// или caloriesapp://
    if settings.google_redirect_uri:
        redirect_uri = settings.google_redirect_uri
    else:
        # Для локальной разработки формируем на основе настроек хоста
        if settings.host == "0.0.0.0":
            # Если хост 0.0.0.0, используем localhost для redirect_uri
            redirect_uri = f"http://localhost:{settings.port}/api/v1/auth/google/callback"
        else:
            redirect_uri = f"http://{settings.host}:{settings.port}/api/v1/auth/google/callback"
    
    # Логируем используемый redirect_uri для отладки
    logger.warning(f"Google OAuth: Using redirect_uri={redirect_uri}, state={state}")
    
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid profile email",
        "access_type": "offline",
        "prompt": "select_account",
        "state": state,  # state передается как есть - это deep link для мобильного приложения
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
    """Обрабатывает callback от Google OAuth"""
    if error:
        redirect_uri = state or "caloriesapp://auth/callback"
        return RedirectResponse(url=f"{redirect_uri}?error={error}")
    
    if not code:
        redirect_uri = state or "caloriesapp://auth/callback"
        return RedirectResponse(url=f"{redirect_uri}?error=no_code")
    
    try:
        # Определяем redirect_uri для обмена токена (должен ТОЧНО совпадать с тем что в Google Console)
        # ВАЖНО: Этот URI должен быть HTTP/HTTPS и должен быть зарегистрирован в Google Cloud Console
        if settings.google_redirect_uri:
            callback_redirect_uri = settings.google_redirect_uri
        else:
            # Для локальной разработки формируем на основе настроек хоста
            if settings.host == "0.0.0.0":
                callback_redirect_uri = f"http://localhost:{settings.port}/api/v1/auth/google/callback"
            else:
                callback_redirect_uri = f"http://{settings.host}:{settings.port}/api/v1/auth/google/callback"
        
        # Логируем используемый redirect_uri для отладки
        logger.warning(f"Google OAuth callback: Using redirect_uri={callback_redirect_uri} for token exchange")
        
        # Обмениваем code на токен
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
            
            # Улучшенная обработка ошибки redirect_uri_mismatch
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
                    # Кодируем сообщение об ошибке
                    error_encoded = quote(error_msg)
                    return RedirectResponse(url=f"{redirect_uri}?error={error_encoded}")
            
            token_response.raise_for_status()
            tokens = token_response.json()
            id_token = tokens.get("id_token")
        
        if not id_token:
            redirect_uri = state or "caloriesapp://auth/callback"
            return RedirectResponse(url=f"{redirect_uri}?error=no_id_token")
        
        # Верифицируем токен
        user_info = await verify_google_token(id_token)
        if not user_info:
            redirect_uri = state or "caloriesapp://auth/callback"
            return RedirectResponse(url=f"{redirect_uri}?error=invalid_token")
        
        # Создаем/находим пользователя
        user = get_or_create_user_by_google(
            db,
            google_id=user_info["sub"],
            email=user_info.get("email"),
            name=user_info.get("name"),
        )
        
        # Генерируем JWT токен
        access_token = create_access_token(data={"sub": str(user.id)})
        
        # Формируем данные пользователя
        user_data = {
            "user_id": user.id,
            "email": user.email,
            "name": user.name or "",
            "google_id": user.google_id,
        }
        
        # Редиректим на фронтенд с токеном и данными
        redirect_uri = state or "caloriesapp://auth/callback"
        user_param = quote(json.dumps(user_data))
        callback_url = f"{redirect_uri}?token={access_token}&user={user_param}"
        
        return RedirectResponse(url=callback_url)
        
    except httpx.HTTPStatusError as e:
        # Обработка ошибок HTTP от Google OAuth
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
    """Аутентификация через Google ID token (для прямого использования)"""
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

    # sub должен быть строкой согласно стандарту JWT
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}


@router.post("/apple", response_model=Token)
async def auth_apple(request: AppleAuthRequest, db: Session = Depends(get_db)):
    """Аутентификация через Apple"""
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

    # sub должен быть строкой согласно стандарту JWT
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    return current_user
