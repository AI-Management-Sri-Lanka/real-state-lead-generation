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
    if "email" in update_data and update_data["email"] != user.email:
        existing_user = await get_user_by_email_db(db, update_data["email"])
        if existing_user:
            raise AppException(error=AppError.AUTH_EMAIL_EXISTS, custom_message="Email already registered by another account.")

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

async def get_users_db(db: AsyncSession, skip: int = 0, limit: int = 100) -> tuple[list[User], int]:
    """Retrieve all users with pagination and total count."""
    try:
        from sqlalchemy import func
        # Get total count
        count_query = select(func.count(User.id))
        total = await db.scalar(count_query)

        # Get paginated results
        query = select(User).offset(skip).limit(limit)
        result = await db.execute(query)
        users = result.scalars().all()
        return list(users), total or 0
    except Exception as e:
        logger.error("DB error occurred in get_users_db: %s", str(e))
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e

async def get_user_by_id_db(db: AsyncSession, user_id: int) -> User | None:
    """Retrieve a user by ID from the database."""
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    except Exception as e:
        logger.error("DB error occurred in get_user_by_id: %s", str(e))
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e

async def toggle_user_active_status_db(db: AsyncSession, user_id: int, is_active: bool, commit: bool = True) -> User:
    """Toggle a user's active status (e.g. for ban/unban property owners)."""
    user = await get_user_by_id_db(db, user_id)
    if not user:
        raise AppException(error=AppError.SYS_RESOURCE_NOT_FOUND)
    return await update_user_db(db, user, {"is_active": is_active}, commit=commit)
