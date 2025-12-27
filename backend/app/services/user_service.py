from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User

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
        # Update existing user if data changed
        if email and user.email != email:
            user.email = email
        if name and user.name != name:
            user.name = name
        if avatar_url and user.avatar_url != avatar_url:
            user.avatar_url = avatar_url
        if first_name and user.first_name != first_name:
            user.first_name = first_name
        if last_name and user.last_name != last_name:
            user.last_name = last_name
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
        # Update existing user if data changed
        if email and user.email != email:
            user.email = email
        if name and user.name != name:
            user.name = name
        if first_name and user.first_name != first_name:
            user.first_name = first_name
        if last_name and user.last_name != last_name:
            user.last_name = last_name
        db.commit()
        db.refresh(user)
    return user
