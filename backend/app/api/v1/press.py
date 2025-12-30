import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.press_inquiry import PressInquiry, InquiryStatus
from app.schemas.press import (
    PressInquiryCreate,
    PressInquiryResponse,
    PressInquiryListResponse,
    PressInquiryUpdate,
)
from app.core.security import get_remote_address, log_security_event

router = APIRouter()


def sanitize_input(text: str, max_length: int = None) -> str:
    if not text:
        return ""
    
    text = text.replace("\x00", "")
    
    text = re.sub(r"[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]", "", text)
    
    if max_length:
        text = text[:max_length]
    
    return text.strip()


def is_spam_email(email: str) -> bool:
    spam_patterns = [
        r"\.(ru|tk|ml|ga|cf)$",
        r"^\d+@",
        r"test@test",
    ]
    
    for pattern in spam_patterns:
        if re.search(pattern, email, re.IGNORECASE):
            return True
    return False


def is_spam_content(subject: str, message: str) -> bool:
    spam_keywords = [
        "viagra", "casino", "lottery", "winner", "prize",
        "click here", "buy now", "limited time", "act now",
        "make money", "get rich", "free money",
    ]
    
    content = (subject + " " + message).lower()
    
    spam_count = sum(1 for keyword in spam_keywords if keyword in content)
    if spam_count >= 3:
        return True
    
    if re.search(r"(.)\1{10,}", content):
        return True
    
    return False


@router.post("/press/inquiry", response_model=PressInquiryResponse, status_code=status.HTTP_201_CREATED)
async def create_press_inquiry(
    inquiry: PressInquiryCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    ip_address = get_remote_address(request)
    user_agent = request.headers.get("user-agent", "")[:500]
    
    email = sanitize_input(inquiry.email.lower(), 255)
    subject = sanitize_input(inquiry.subject, 500)
    message = sanitize_input(inquiry.message, 5000)
    
    if is_spam_email(email):
        log_security_event("spam_detected", {
            "type": "email",
            "email": email,
            "ip": ip_address
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address"
        )
    
    if is_spam_content(subject, message):
        log_security_event("spam_detected", {
            "type": "content",
            "ip": ip_address
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message appears to be spam"
        )
    
    if settings.environment != "development":
        from datetime import datetime, timedelta
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        
        recent_inquiry = db.query(PressInquiry).filter(
            PressInquiry.ip_address == ip_address,
            PressInquiry.created_at >= five_minutes_ago,
            PressInquiry.email == email
        ).first()
        
        if recent_inquiry:
            log_security_event("duplicate_inquiry", {
                "ip": ip_address,
                "email": email
            }, request)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait 5 minutes before submitting another inquiry"
            )
    
    db_inquiry = PressInquiry(
        email=email,
        subject=subject,
        message=message,
        ip_address=ip_address,
        user_agent=user_agent,
        status="pending"
    )
    
    try:
        db.add(db_inquiry)
        db.commit()
        db.refresh(db_inquiry)
        return db_inquiry
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit inquiry"
        )


@router.get("/press/inquiries", response_model=List[PressInquiryListResponse])
async def get_press_inquiries(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[InquiryStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PressInquiry)
    
    if status_filter:
        query = query.filter(PressInquiry.status == status_filter)
    
    inquiries = query.order_by(desc(PressInquiry.created_at)).offset(skip).limit(limit).all()
    
    return inquiries


@router.get("/press/inquiries/{inquiry_id}", response_model=PressInquiryListResponse)
async def get_press_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inquiry = db.query(PressInquiry).filter(PressInquiry.id == inquiry_id).first()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    return inquiry


@router.patch("/press/inquiries/{inquiry_id}", response_model=PressInquiryListResponse)
async def update_press_inquiry(
    inquiry_id: int,
    update_data: PressInquiryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inquiry = db.query(PressInquiry).filter(PressInquiry.id == inquiry_id).first()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    if update_data.status:
        status_value = update_data.status.value if hasattr(update_data.status, 'value') else str(update_data.status)
        inquiry.status = status_value
        if status_value == "replied":
            from datetime import datetime
            inquiry.replied_at = datetime.utcnow()
    
    if update_data.admin_notes is not None:
        inquiry.admin_notes = sanitize_input(update_data.admin_notes, 2000)
    
    try:
        db.commit()
        db.refresh(inquiry)
        return inquiry
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update inquiry"
        )

