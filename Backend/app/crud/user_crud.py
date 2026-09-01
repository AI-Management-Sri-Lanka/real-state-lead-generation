from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.password_reset_otp import PasswordResetOTP
from app.core.errors import AppException, AppError
from app.core.logger import get_logger
from app.core.security import verify_password

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

async def get_user_by_google_id_db(db: AsyncSession, google_id: str) -> User | None:
    """Retrieve a user by their linked Google account id ("sub" claim)."""
    try:
        result = await db.execute(select(User).where(User.google_id == google_id))
        return result.scalar_one_or_none()
    except Exception as e:
        logger.error("DB error occurred in get_user_by_google_id: %s", str(e))
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
async def create_password_reset_otp_db(db: AsyncSession, user_id: int, otp_hash: str, expires_at: datetime, commit: bool = True) -> PasswordResetOTP:
    """Store a fresh OTP for password reset."""
    otp_record = PasswordResetOTP(user_id=user_id, otp_hash=otp_hash, expires_at=expires_at)
    try:
        db.add(otp_record)
        if commit:
            await db.commit()
            await db.refresh(otp_record)
        else:
            await db.flush()
        return otp_record
    except Exception as e:
        await db.rollback()
        logger.error("DB error occurred in create_password_reset_otp_db: %s", str(e))
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e

async def get_valid_password_reset_otp_db(db: AsyncSession, user_id: int, otp: str) -> PasswordResetOTP | None:
    """Fetch a matching, unexpired, unused OTP for this user."""
    try:
        result = await db.execute(
            select(PasswordResetOTP)
            .where(PasswordResetOTP.user_id == user_id)
            .where(PasswordResetOTP.is_used.is_(False))
            .where(PasswordResetOTP.expires_at > datetime.utcnow())
            .order_by(PasswordResetOTP.created_at.desc())
        )
        otp_records = result.scalars().all()
        for otp_record in otp_records:
            if otp_record.otp_hash and verify_password(otp, otp_record.otp_hash):
                return otp_record
        return None
    except Exception as e:
        logger.error("DB error occurred in get_valid_password_reset_otp_db: %s", str(e))
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e


async def mark_password_reset_otp_used_db(db: AsyncSession, otp_record: PasswordResetOTP, commit: bool = True) -> PasswordResetOTP:
    """mark selected OTP as used for single-time reset."""
    try:
        otp_record.is_used = True
        if commit:
            await db.commit()
            await db.refresh(otp_record)
        else:
            await db.flush()
        return otp_record
    except Exception as e:
        await db.rollback()
        logger.error("DB error occurred in mark_password_reset_otp_used_db: %s", str(e))
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e


async def invalidate_user_password_reset_otps_db(db: AsyncSession, user_id: int, commit: bool = True) -> None:
    """Mark all active OTP records for a user as used to prevent reuse."""
    try:
        result = await db.execute(
            select(PasswordResetOTP).where(PasswordResetOTP.user_id == user_id).where(PasswordResetOTP.is_used.is_(False))
        )
        records = result.scalars().all()
        for record in records:
            record.is_used = True
        if commit:
            await db.commit()
        else:
            await db.flush()
    except Exception as e:
        await db.rollback()
        logger.error("DB error occurred in invalidate_user_password_reset_otps_db: %s", str(e))
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e