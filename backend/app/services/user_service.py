from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User

def get_or_create_user_by_google(
    db: Session, google_id: str, email: Optional[str] = None, name: Optional[str] = None
) -> User:
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = User(google_id=google_id, email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:

        if email and user.email != email:
            user.email = email
        if name and user.name != name:
            user.name = name
        db.commit()
        db.refresh(user)
    return user

def get_or_create_user_by_apple(
    db: Session, apple_id: str, email: Optional[str] = None, name: Optional[str] = None
) -> User:
    user = db.query(User).filter(User.apple_id == apple_id).first()
    if not user:
        user = User(apple_id=apple_id, email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:

        if email and user.email != email:
            user.email = email
        if name and user.name != name:
            user.name = name
        db.commit()
        db.refresh(user)
    return user
