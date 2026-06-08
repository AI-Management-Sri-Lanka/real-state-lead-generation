
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.core.errors import AppException, AppError
from app.core.logger import get_logger
from app.crud import user_crud

logger = get_logger(__name__)

from app.core.security import hash_password, verify_password


async def create_user(db: AsyncSession, user: UserCreate, commit: bool = True) -> User:
    """Create a new user by delegating to the CRUD layer."""
    hashed_password = hash_password(user.password)
    
    user_data = {
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": hashed_password
    }

    return await user_crud.create_user_db(db, user_data, commit=commit)


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Retrieve a user by delegating to the CRUD layer."""
    return await user_crud.get_user_by_email_db(db, email)


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    """Authenticate a user by email and password."""
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS)
    return user
