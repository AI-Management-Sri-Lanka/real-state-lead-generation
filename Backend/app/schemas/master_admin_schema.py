from pydantic import BaseModel, EmailStr
from datetime import datetime

class MasterAdminCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Admin Name",
                "email": "admin@example.com",
                "password": "SecurePassword123!"
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
