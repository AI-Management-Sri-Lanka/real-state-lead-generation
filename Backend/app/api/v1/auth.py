from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas.user_schema import UserCreate, UserResponse, UserLogin
from app.schemas.response_schema import ResponseSchema
from app.services.auth.auth_service import create_user, authenticate_user
from app.models.user import User
from app.db.session import get_db
from app.core.response import ok
from app.core.errors import AppException, AppError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=ResponseSchema[UserResponse], status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create a new user account."""
    db_user = await create_user(db, user)
    return ok(message="User created successfully", item=db_user)


@router.post("/login", response_model=ResponseSchema[UserResponse])
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return user data."""
    db_user = await authenticate_user(db, user.email, user.password)
    return ok(message="Login successful", item=db_user)


@router.get("/me", response_model=ResponseSchema[UserResponse])
async def get_current_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get current user info (requires authentication - to be implemented with JWT)."""
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise AppException(error=AppError.AUTH_USER_NOT_FOUND)
    return ok(message="User retrieved successfully", item=db_user)
