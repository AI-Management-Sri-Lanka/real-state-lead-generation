from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Any, Optional
from app.core.errors import ErrorDefinition

def ok(message: str = "Success", item: Any = None) -> dict:
    """Returns a standardized successful dict response (to be filtered by response_model)."""
    return {"success": True, "message": message, "data": item}

def build_error_dict(
    error_def: ErrorDefinition, 
    request_id: Optional[str] = None, 
    details: Optional[Any] = None
) -> dict:
    """Builds a rich error dictionary from an ErrorDefinition."""
    error_dict = {
        "code": error_def.code,
        "message": error_def.user_message,
        "category": error_def.category,
        "severity": error_def.severity,
        "module": error_def.module,
        "recommended_action": error_def.recommended_action
    }
    if request_id:
        error_dict["request_id"] = request_id
    if details is not None:
        error_dict["details"] = details
    return error_dict

def fail(error_dict: dict, status_code: int = 400) -> JSONResponse:
    """Returns a standardized failed JSON response."""
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": error_dict}
    )
