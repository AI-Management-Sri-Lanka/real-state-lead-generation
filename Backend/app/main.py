from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.errors import AppError, AppException
from app.core.response import fail, build_error_dict
from app.core.logger import get_logger
import uuid
from app.db.base_class import Base
from app.db.session import engine

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

# Include routers
app.include_router(auth.router)


@app.on_event("startup")
async def startup():
    """Create database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Real Estate Lead Generation API"}
