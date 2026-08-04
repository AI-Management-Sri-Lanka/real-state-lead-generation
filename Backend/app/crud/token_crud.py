from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from app.models.token import RefreshToken, BlacklistedToken, MasterAdminRefreshToken
from app.core.errors import AppException, AppError
from app.core.logger import get_logger

logger = get_logger(__name__)

async def create_refresh_token_db(db: AsyncSession, user_id: int, token: str, expires_at: datetime, commit: bool = True) -> RefreshToken:
    db_token = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    try:
        db.add(db_token)
        if commit:
            await db.commit()
            await db.refresh(db_token)
        return db_token
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"DB error in create_refresh_token_db: {e}")
        raise AppException(error=AppError.DB_INTEGRITY_ERROR) from e

async def get_refresh_token_db(db: AsyncSession, token: str) -> RefreshToken | None:
    try:
        result = await db.execute(select(RefreshToken).where(RefreshToken.token == token))
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error(f"DB error in get_refresh_token_db: {e}")
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e

async def revoke_refresh_token_db(db: AsyncSession, token: str, commit: bool = True):
    db_token = await get_refresh_token_db(db, token)
    if db_token:
        try:
            db_token.is_revoked = True
            if commit:
                await db.commit()
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"DB error in revoke_refresh_token_db: {e}")
            raise AppException(error=AppError.DB_INTEGRITY_ERROR) from e

async def add_blacklisted_token(db: AsyncSession, token: str, commit: bool = True):
    db_token = BlacklistedToken(token=token)
    try:
        db.add(db_token)
        if commit:
            await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"DB error in add_blacklisted_token: {e}")
        pass

async def is_token_blacklisted(db: AsyncSession, token: str) -> bool:
    try:
        result = await db.execute(select(BlacklistedToken).where(BlacklistedToken.token == token))
        return result.scalar_one_or_none() is not None
    except SQLAlchemyError:
        return False

async def create_master_admin_refresh_token_db(db: AsyncSession, admin_id: int, token: str, expires_at: datetime, commit: bool = True):
    db_token = MasterAdminRefreshToken(
        admin_id=admin_id,
        token=token,
        expires_at=expires_at
    )
    try:
        db.add(db_token)
        if commit:
            await db.commit()
            await db.refresh(db_token)
        return db_token
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"DB error in create_master_admin_refresh_token_db: {e}")
        raise AppException(error=AppError.DB_INTEGRITY_ERROR) from e

async def get_master_admin_refresh_token_db(db: AsyncSession, token: str):
    try:
        result = await db.execute(select(MasterAdminRefreshToken).where(MasterAdminRefreshToken.token == token))
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error(f"DB error in get_master_admin_refresh_token_db: {e}")
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE) from e

async def revoke_master_admin_refresh_token_db(db: AsyncSession, token: str, commit: bool = True):
    db_token = await get_master_admin_refresh_token_db(db, token)
    if db_token:
        try:
            db_token.is_revoked = True
            if commit:
                await db.commit()
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"DB error in revoke_master_admin_refresh_token_db: {e}")
            raise AppException(error=AppError.DB_INTEGRITY_ERROR) from e
