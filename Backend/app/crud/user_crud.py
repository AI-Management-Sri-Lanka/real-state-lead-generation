from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.core.errors import AppException, AppError
from app.core.logger import get_logger

logger = get_logger(__name__)

async def create_user_db(db: AsyncSession, user_data: dict) -> User:
    """Insert a new user into the database."""
    db_user = User(**user_data)
    try:
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        await db.rollback()
        if "email" in str(e):
            raise AppException(error=AppError.AUTH_EMAIL_EXISTS)
        raise AppException(error=AppError.DB_INTEGRITY_ERROR)
    except Exception as e:
        logger.error("DB error occurred in create_user: %s", str(e))
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e

async def get_user_by_email_db(db: AsyncSession, email: str) -> User | None:
    """Retrieve a user by email from the database."""
    try:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    except Exception as e:
        logger.error("DB error occurred in get_user_by_email: %s", str(e))
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e
