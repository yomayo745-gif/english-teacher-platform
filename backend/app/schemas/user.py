from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TelegramAuthRequest(BaseModel):
    init_data: str = Field(..., description="Raw initData string from Telegram WebApp")

class DevAuthRequest(BaseModel):
    role: str = Field("STUDENT", description="STUDENT, TEACHER, or ADMIN")
    telegram_id: Optional[int] = None
    username: Optional[str] = None
    first_name: str = "Test User"
    last_name: Optional[str] = None

class UserBase(BaseModel):
    telegram_id: Optional[int] = None
    login: Optional[str] = None
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    role: str = "STUDENT"
    status: str = "ACTIVE"
    phone: Optional[str] = None
    notes: Optional[str] = None
    language_code: str = "en"

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    last_seen_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class StudentLoginRequest(BaseModel):
    login: str = Field(..., description="Student login or username")
    password: str = Field(..., description="Student account password")
    telegram_init_data: Optional[str] = Field(None, description="Optional raw initData from Telegram WebApp")

class TelegramCheckRequest(BaseModel):
    init_data: str

class StudentCreateRequest(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    login: Optional[str] = None
    password: Optional[str] = None
    group_id: Optional[str] = None
    telegram_id: Optional[int] = None
    phone: Optional[str] = None
    status: str = "ACTIVE"
    notes: Optional[str] = None

class StudentUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    login: Optional[str] = None
    telegram_id: Optional[int] = None
    group_id: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class StudentResetPasswordRequest(BaseModel):
    password: Optional[str] = Field(None, description="Optional password; if omitted, a secure password is generated")

class StudentStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="ACTIVE or DISABLED")
