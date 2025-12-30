from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def _is_custom_avatar(avatar_url: Optional[str]) -> bool:
    if not avatar_url:
        return False
    
    custom_indicators = [
        settings.yandex_storage_endpoint,
        "storage.yandexcloud.net",
        f"{settings.yandex_storage_bucket_name}.",
        "/avatars/", 
    ]
    
    return any(indicator in avatar_url for indicator in custom_indicators)


def get_or_create_user_by_google(
    db: Session, 
    google_id: str, 
    email: Optional[str] = None, 
    name: Optional[str] = None,
    avatar_url: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None
) -> User:
    user = db.query(User).filter(User.google_id == google_id).first()
    
    if not user:
        user = User(
            google_id=google_id, 
            email=email, 
            name=name,
            avatar_url=avatar_url,
            first_name=first_name,
            last_name=last_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        updated = False
        
        if email and user.email != email:
            user.email = email
            updated = True
            
        if name and user.name != name:
            user.name = name
            updated = True
        
        if avatar_url and not _is_custom_avatar(user.avatar_url):
            if user.avatar_url != avatar_url:
                user.avatar_url = avatar_url
                updated = True
        
        if first_name and user.first_name != first_name:
            user.first_name = first_name
            updated = True
            
        if last_name and user.last_name != last_name:
            user.last_name = last_name
            updated = True
        
        if updated:
            db.commit()
            db.refresh(user)
            
    return user

def get_or_create_user_by_apple(
    db: Session, 
    apple_id: str, 
    email: Optional[str] = None, 
    name: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None
) -> User:
    user = db.query(User).filter(User.apple_id == apple_id).first()
    
    if not user:
        user = User(
            apple_id=apple_id, 
            email=email, 
            name=name,
            first_name=first_name,
            last_name=last_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        updated = False
        
        if email and user.email != email:
            user.email = email
            updated = True
            
        if name and user.name != name:
            user.name = name
            updated = True
            
        if first_name and user.first_name != first_name:
            user.first_name = first_name
            updated = True
            
        if last_name and user.last_name != last_name:
            user.last_name = last_name
            updated = True
        
        if updated:
            db.commit()
            db.refresh(user)
            
    return user
