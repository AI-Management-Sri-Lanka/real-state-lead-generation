from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str
    category: str
    severity: str
    module: str
    recommended_action: str
    request_id: Optional[str] = None
    details: Optional[Any] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "code": "AUTH-001",
                    "message": "No account found with this email.",
                    "category": "validation_error",
                    "severity": "medium",
                    "module": "auth",
                    "recommended_action": "Check email spelling or sign up.",
                    "request_id": "req-12345"
                }
            ]
        }
    }

class ResponseSchema(BaseModel, Generic[T]):
    success: bool
    message: Optional[str] = None
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "success": True,
                    "message": "User created successfully",
                    "data": {
                        "id": 1,
                        "full_name": "John Doe",
                        "email": "user@example.com",
                        "is_active": True,
                        "created_at": "2024-05-24T12:00:00Z"
                    }
                }
            ]
        }
    }
