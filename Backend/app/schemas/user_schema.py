from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=255)

    model_config = {
        "extra": "forbid",
        "json_schema_extra": {
            "examples": [
                {
                    "full_name": "John Doe",
                    "email": "user@example.com",
                    "password": "stringst"
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