from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional
from datetime import datetime
from app.models.press_inquiry import InquiryStatus


class PressInquiryCreate(BaseModel):
    email: str = Field(..., max_length=255, description="Email address")
    subject: str = Field(..., min_length=1, max_length=500, description="Subject of inquiry")
    message: str = Field(..., min_length=10, max_length=5000, description="Message content")

    @validator("email")
    def validate_email(cls, v):
        if not v:
            raise ValueError("Email is required")
        v = v.strip().lower()
        if len(v) > 255:
            raise ValueError("Email too long")
        if "@" not in v or "." not in v.split("@")[1]:
            raise ValueError("Invalid email format")
        return v

    @validator("subject")
    def validate_subject(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Subject cannot be empty")
        dangerous_chars = ["<", ">", "\x00", "\r", "\n"]
        for char in dangerous_chars:
            if char in v:
                raise ValueError("Subject contains invalid characters")
        return v

    @validator("message")
    def validate_message(cls, v):
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Message must be at least 10 characters")
        if len(v) > 5000:
            raise ValueError("Message too long (max 5000 characters)")
        return v

    class Config:
        schema_extra = {
            "example": {
                "email": "reporter@example.com",
                "subject": "Media inquiry about new features",
                "message": "I would like to schedule an interview about the new features in your app."
            }
        }


class PressInquiryResponse(BaseModel):
    id: int
    email: str
    subject: str
    message: str
    status: InquiryStatus
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PressInquiryListResponse(BaseModel):
    id: int
    email: str
    subject: str
    message: str
    status: InquiryStatus
    ip_address: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    admin_notes: Optional[str]
    replied_at: Optional[datetime]

    class Config:
        from_attributes = True


class PressInquiryUpdate(BaseModel):
    status: Optional[InquiryStatus] = None
    admin_notes: Optional[str] = Field(None, max_length=2000)

    @validator("admin_notes")
    def validate_admin_notes(cls, v):
        if v is not None and len(v) > 2000:
            raise ValueError("Admin notes too long")
        return v

    class Config:
        from_attributes = True

