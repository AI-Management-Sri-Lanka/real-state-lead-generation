from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth
from app.api.v1.chat import router as chat_router
from app.api.v1.dashboard import router as dashboard_router
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.errors import AppError, AppException
from app.core.response import fail, build_error_dict
from app.core.logger import get_logger
import uuid
from app.db.base_class import Base
from app.db.session import engine
from app.api.v1.session_router import router as session_router
from sqlalchemy.exc import SQLAlchemyError

app = FastAPI(
    title="Real Estate Lead Generation API",
    description="AI-powered real estate lead generation platform",
    version="0.1.0"
)

logger = get_logger(__name__)

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response

@app.exception_handler(AppException)
async def app_error_handler(request: Request, exc: AppException):
    error_def = exc.error
    request_id = getattr(request.state, "request_id", None)
    
    # Dynamic logging based on log_level
    log_msg = f"[{request_id}] {error_def.code} at {request.url.path}: {error_def.internal_message}"
    if error_def.log_level == "error":
        logger.error(log_msg)
    elif error_def.log_level == "warn":
        logger.warning(log_msg)
    else:
        logger.info(log_msg)
        
    if getattr(error_def, "alert_required", False) and getattr(error_def, "severity", "") == "critical":
        logger.critical(f"ALERT REQUIRED: {error_def.code} occurred. Request ID: {request_id}")
        
    error_dict = build_error_dict(error_def, request_id)
    return fail(error_dict=error_dict, status_code=error_def.http_status)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", None)
    errors = exc.errors()
    
    # Compile user-friendly message
    error_msgs = []
    for err in errors:
        loc_str = " -> ".join(str(item) for item in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        error_msgs.append(f"{loc_str}: {msg}")
        
    message = "Request validation failed: " + "; ".join(error_msgs)
    logger.warning(f"[{request_id}] Validation error at {request.url.path}: {message}")
    
    error_def = AppError.VALIDATION_ERROR
    error_dict = build_error_dict(error_def, request_id, details=errors)
    error_dict["message"] = message
    
    return fail(error_dict=error_dict, status_code=error_def.http_status)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    request_id = getattr(request.state, "request_id", None)
    logger.info(f"[{request_id}] HTTP error at {request.url.path}: {exc.detail}")
    
    error_def = AppError.HTTP_ERROR
    error_dict = build_error_dict(error_def, request_id)
    error_dict["message"] = exc.detail
    
    return fail(error_dict=error_dict, status_code=exc.status_code)

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    request_id = getattr(request.state, "request_id", None)
    logger.error(f"[{request_id}] Database error at {request.url.path}: {str(exc)}")
    
    error_def = AppError.DB_INTEGRITY_ERROR
    error_dict = build_error_dict(error_def, request_id)
    error_dict["message"] = "A database error occurred. Please try again later."
    
    return fail(error_dict=error_dict, status_code=500)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", None)
    logger.exception(f"[{request_id}] Unhandled server error at {request.url.path}: {str(exc)}")
    
    error_dict = {
        "code": "SYS-500",
        "message": "An internal server error occurred.",
        "category": "system_error",
        "severity": "critical",
        "module": "system",
        "recommended_action": "Contact support if the issue persists.",
        "request_id": request_id
    }
    return fail(error_dict=error_dict, status_code=500)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React/Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers under /api/v1 prefix
app.include_router(auth.router,      prefix="/api/v1")
app.include_router(session_router,   prefix="/api/v1")
app.include_router(chat_router,      prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    """Create database tables on startup."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to the database or create tables on startup: {e}")
        logger.warning("The application has started, but database-dependent endpoints will fail.")


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Real Estate Lead Generation API"}
