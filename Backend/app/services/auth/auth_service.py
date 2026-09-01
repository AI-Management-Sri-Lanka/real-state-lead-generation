from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.core.errors import AppException, AppError
from app.core.logger import get_logger
from app.crud import user_crud
from app.services.auth.google_service import verify_google_id_token

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
    # Google-only accounts have no hashed_password to check against.
    if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS)
    return user


async def authenticate_or_create_google_user(db: AsyncSession, id_token: str, commit: bool = True) -> User:
    """Sign in with Google: verify the ID token, then either

    1. return the user already linked to this Google account, or
    2. link this Google account to an existing local account with the same
       (verified) email, or
    3. create a brand-new user for this Google account.
    """
    profile = verify_google_id_token(id_token)

    existing_by_google = await user_crud.get_user_by_google_id_db(db, profile.google_id)
    if existing_by_google:
        if not existing_by_google.is_active:
            raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS, custom_message="This account has been disabled.")
        return existing_by_google

    existing_by_email = await user_crud.get_user_by_email_db(db, profile.email)
    if existing_by_email:
        if not existing_by_email.is_active:
            raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS, custom_message="This account has been disabled.")
        # Link this Google account to the existing (email/password) user so
        # they can sign in either way going forward.
        return await user_crud.update_user_db(
            db, existing_by_email, {"google_id": profile.google_id}, commit=commit
        )

    # Brand-new account, Google-only (no local password set).
    user_data = {
        "full_name": profile.full_name,
        "email": profile.email,
        "hashed_password": None,
        "google_id": profile.google_id,
        "auth_provider": "google",
    }
    return await user_crud.create_user_db(db, user_data, commit=commit)