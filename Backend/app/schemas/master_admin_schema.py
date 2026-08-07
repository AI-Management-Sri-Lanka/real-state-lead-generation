from pydantic import BaseModel, EmailStr, model_validator, field_validator
from datetime import datetime
from app.schemas.user_schema import validate_strong_password

class MasterAdminCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator('password')
    def validate_password(cls, v):
        return validate_strong_password(v)

    @model_validator(mode='after')
    def verify_passwords(self) -> 'MasterAdminCreate':
        if self.password != self.confirm_password:
            raise ValueError('Passwords do not match')
        return self

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Admin Name",
                "email": "admin@example.com",
                "password": "SecurePassword123!",
                "confirm_password": "SecurePassword123!"
            }
        }

class MasterAdminLogin(BaseModel):
    email: EmailStr
    password: str

class MasterAdminResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MasterAdminUpdate(BaseModel):
    full_name: str | None = None

class MasterAdminPasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    def validate_password(cls, v):
        return validate_strong_password(v)

    @model_validator(mode='after')
    def verify_passwords(self) -> 'MasterAdminPasswordChange':
        if self.new_password != self.confirm_password:
            raise ValueError('Passwords do not match')
        if self.new_password == self.current_password:
            raise ValueError('New password cannot be the same as the current password')
        return self
