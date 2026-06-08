from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.user import User
from app.core.security import decode_token
from app.core.errors import AppException, AppError
from app.core.logger import get_logger

logger = get_logger(__name__)
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise ValueError("Token missing subject")
        user_id = int(user_id_str)
    except Exception as e:
        logger.warning(f"Invalid token: {e}")
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS)

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise AppException(error=AppError.AUTH_USER_NOT_FOUND)
        
    logger.info(f"User {user.email} (ID: {user.id}) successfully authenticated.")
    return user
