import re
from pydantic import BaseModel, EmailStr, Field, model_validator, field_validator
from datetime import datetime

def validate_strong_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError('Password must be at least 8 characters long')
    if not re.search(r'[A-Z]', v):
        raise ValueError('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', v):
        raise ValueError('Password must contain at least one lowercase letter')
    if not re.search(r'[0-9]', v):
        raise ValueError('Password must contain at least one number')
    if not re.search(r'[!@#$%^&*()_+={}\[\]|\\:;"\'<>,.?/~`-]', v):
        raise ValueError('Password must contain at least one special character')
    if re.search(r'\s', v):
        raise ValueError('Password cannot contain spaces')
    return v

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=255)
    confirm_password: str = Field(..., min_length=8, max_length=255)

    @field_validator('password')
    def validate_password(cls, v):
        return validate_strong_password(v)

    @model_validator(mode='after')
    def verify_passwords(self) -> 'UserCreate':
        if self.password != self.confirm_password:
            raise ValueError('Passwords do not match')
        return self

    model_config = {
        "extra": "forbid",
        "json_schema_extra": {
            "examples": [
                {
                    "full_name": "John Doe",
                    "email": "user@example.com",
                    "password": "SecurePassword123!",
                    "confirm_password": "SecurePassword123!"
                }
            ]
        }
    }

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    created_at: datetime
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "full_name": "John Doe",
                    "email": "user@example.com",
                    "is_active": True,
                    "created_at": "2024-05-24T12:00:00Z"
                }
            ]
        }
    }

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "user@example.com",
                    "password": "stringst"
                }
            ]
        }
    }

class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=255)
    email: EmailStr | None = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=255)
    confirm_password: str = Field(..., min_length=8, max_length=255)

    @field_validator('new_password')
    def validate_password(cls, v):
        return validate_strong_password(v)

    @model_validator(mode='after')
    def verify_passwords(self) -> 'PasswordChange':
        if self.new_password != self.confirm_password:
            raise ValueError('Passwords do not match')
        if self.new_password == self.current_password:
            raise ValueError('New password cannot be the same as the current password')
        return self

class AdminResetPassword(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=255)
    confirm_password: str = Field(..., min_length=8, max_length=255)

    @field_validator('new_password')
    def validate_password(cls, v):
        return validate_strong_password(v)

    @model_validator(mode='after')
    def verify_passwords(self) -> 'AdminResetPassword':
        if self.new_password != self.confirm_password:
            raise ValueError('Passwords do not match')
        return self

    model_config = {
        "extra": "forbid",
        "json_schema_extra": {
            "example": {
                "new_password": "NewSecurePassword123!",
                "confirm_password": "NewSecurePassword123!"
            }
        }
    }