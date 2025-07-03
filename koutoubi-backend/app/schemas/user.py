from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.core.constants import UserRole, DEFAULT_USER_ROLE


class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool = True
    role: str = DEFAULT_USER_ROLE
    
    @field_validator('role')
    def validate_role(cls, v):
        if v not in UserRole.get_all_roles():
            raise ValueError(f'Invalid role. Must be one of: {", ".join(UserRole.get_all_roles())}')
        return v


class UserCreate(UserBase):
    password: str
    
    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Le mot de passe doit contenir au moins 6 caractères')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    
    @field_validator('new_password')
    def validate_password(cls, v):
        if v is not None and len(v) < 6:
            raise ValueError('Le mot de passe doit contenir au moins 6 caractères')
        return v


class User(UserBase):
    id: str
    avatar_url: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserInDB(User):
    hashed_password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None