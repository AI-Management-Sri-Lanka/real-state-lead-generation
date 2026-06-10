from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.core.errors import AppException, AppError
from app.core.logger import get_logger

logger = get_logger(__name__)

async def create_user_db(db: AsyncSession, user_data: dict, commit: bool = True) -> User:
    """Insert a new user into the database."""
    db_user = User(**user_data)
    try:
        db.add(db_user)
        if commit:
            await db.commit()
            await db.refresh(db_user)
        else:
            await db.flush()
        return db_user
    except IntegrityError as e:
        await db.rollback()
        if "email" in str(e):
            raise AppException(error=AppError.AUTH_EMAIL_EXISTS)
        raise AppException(error=AppError.DB_INTEGRITY_ERROR)
    except Exception as e:
        await db.rollback()
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

async def update_user_db(db: AsyncSession, user: User, update_data: dict, commit: bool = True) -> User:
    """Update user information in the database."""
    try:
        for key, value in update_data.items():
            setattr(user, key, value)
        if commit:
            await db.commit()
            await db.refresh(user)
        else:
            await db.flush()
        return user
    except IntegrityError as e:
        await db.rollback()
        if "email" in str(e):
            raise AppException(error=AppError.AUTH_EMAIL_EXISTS)
        raise AppException(error=AppError.DB_INTEGRITY_ERROR)
    except Exception as e:
        await db.rollback()
        logger.error("DB error occurred in update_user: %s", str(e))
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e

async def delete_user_db(db: AsyncSession, user: User, commit: bool = True) -> None:
    """Delete a user from the database."""
    try:
        await db.delete(user)
        if commit:
            await db.commit()
        else:
            await db.flush()
    except Exception as e:
        await db.rollback()
        logger.error("DB error occurred in delete_user: %s", str(e))
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e
