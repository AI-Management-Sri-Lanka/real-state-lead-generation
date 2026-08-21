
import secrets
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.core.errors import AppException, AppError
from app.core.logger import get_logger
from app.core.config import settings
from app.crud import user_crud

logger = get_logger(__name__)

from app.core.security import hash_password, verify_password

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


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


async def authenticate_or_create_google_user(db: AsyncSession, access_token: str) -> User:
    """Verify a Google OAuth access token and find or create the matching user."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            tokeninfo_resp = await client.get(GOOGLE_TOKENINFO_URL, params={"access_token": access_token})
            userinfo_resp = await client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    except httpx.HTTPError as e:
        logger.warning("Google token verification request failed: %s", str(e))
        raise AppException(error=AppError.AUTH_GOOGLE_TOKEN_INVALID) from e

    if tokeninfo_resp.status_code != 200 or userinfo_resp.status_code != 200:
        raise AppException(error=AppError.AUTH_GOOGLE_TOKEN_INVALID)

    tokeninfo = tokeninfo_resp.json()
    if settings.GOOGLE_CLIENT_ID and tokeninfo.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise AppException(error=AppError.AUTH_GOOGLE_TOKEN_INVALID)

    userinfo = userinfo_resp.json()
    email = userinfo.get("email")
    email_verified = userinfo.get("email_verified")
    if isinstance(email_verified, str):
        email_verified = email_verified.lower() == "true"
    if not email or not email_verified:
        raise AppException(error=AppError.AUTH_GOOGLE_TOKEN_INVALID)

    existing_user = await get_user_by_email(db, email)
    if existing_user:
        return existing_user

    full_name = userinfo.get("name") or email.split("@")[0]
    user_data = {
        "full_name": full_name,
        "email": email,
        # Google-authenticated users sign in via OAuth only; this hash is unusable for password login.
        "hashed_password": hash_password(secrets.token_urlsafe(32)),
    }
    return await user_crud.create_user_db(db, user_data)
