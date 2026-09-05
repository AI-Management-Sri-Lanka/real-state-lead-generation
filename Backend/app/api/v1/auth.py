from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.schemas.user_schema import (
    UserCreate,
    UserResponse,
    UserLogin,
    UserUpdate,
    PasswordChange,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordWithOTP,
    GoogleAuthRequest,
)
from app.schemas.token_schema import TokenResponse, RefreshTokenRequest
from app.schemas.response_schema import ResponseSchema
from app.services.auth.auth_service import create_user, authenticate_user, authenticate_or_create_google_user
from app.services.auth.otp_service import generate_otp, hash_otp, get_otp_expiration, send_otp_email
from app.crud.token_crud import create_refresh_token_db, get_refresh_token_db, revoke_refresh_token_db
from app.crud.user_crud import (
    update_user_db,
    delete_user_db,
    get_user_by_email_db,
    create_password_reset_otp_db,
    get_valid_password_reset_otp_db,
    invalidate_user_password_reset_otps_db,
    mark_password_reset_otp_used_db,
)
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password, hash_password
from app.core.config import settings
from app.models.user import User
from app.db.session import get_db
from app.core.response import ok
from app.core.errors import AppException, AppError
from app.services.dependencies.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


async def generate_tokens_for_user(user_id: int, db: AsyncSession, commit: bool = True) -> TokenResponse:
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    await create_refresh_token_db(db, user_id, refresh_token, expires_at, commit=commit)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post("/signup", response_model=ResponseSchema[TokenResponse], status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create a new user account and return tokens."""
    try:
        db_user = await create_user(db, user, commit=False)
        tokens = await generate_tokens_for_user(db_user.id, db, commit=False)
        await db.commit()
        return ok(message="User created successfully", item=tokens)
    except Exception as e:
        await db.rollback()
        raise e


@router.post("/login", response_model=ResponseSchema[TokenResponse])
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return tokens."""
    db_user = await authenticate_user(db, user.email, user.password)
    tokens = await generate_tokens_for_user(db_user.id, db)
    return ok(message="Login successful", item=tokens)


@router.post("/google", response_model=ResponseSchema[TokenResponse])
async def google_auth(payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Sign in (or sign up) using a Google ID token from Google Identity Services.

    Verifies the token server-side, then finds/links/creates the matching
    user and issues the same access + refresh token pair as email/password
    login, so the frontend can treat it identically after this call.
    """
    try:
        db_user = await authenticate_or_create_google_user(db, payload.id_token, commit=False)
        tokens = await generate_tokens_for_user(db_user.id, db, commit=False)
        await db.commit()
        return ok(message="Google sign-in successful", item=tokens)
    except Exception as e:
        await db.rollback()
        raise e


@router.post("/refresh", response_model=ResponseSchema[TokenResponse])
async def refresh_token(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh the access token using a refresh token."""
    try:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise ValueError("Token missing subject")
        user_id = int(user_id_str)
    except Exception:
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS)

    db_token = await get_refresh_token_db(db, request.refresh_token)
    if not db_token or db_token.is_revoked or db_token.expires_at < datetime.utcnow():
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS)

    try:
        # Revoke old token and generate new tokens in one transaction
        await revoke_refresh_token_db(db, request.refresh_token, commit=False)
        tokens = await generate_tokens_for_user(user_id, db, commit=False)
        await db.commit()
        return ok(message="Token refreshed successfully", item=tokens)
    except Exception as e:
        await db.rollback()
        raise e


@router.post("/logout", response_model=ResponseSchema[None])
async def logout(
    request: RefreshTokenRequest, 
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
):
    """Logout the user by revoking the refresh token and blacklisting the access token."""
    db_token = await get_refresh_token_db(db, request.refresh_token)
    if not db_token or db_token.is_revoked:
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS, custom_message="Invalid or already revoked refresh token")

    await revoke_refresh_token_db(db, request.refresh_token)
    
    from app.crud.token_crud import add_blacklisted_token
    if credentials and credentials.credentials:
        await add_blacklisted_token(db, credentials.credentials)
        
    return ok(message="Logged out successfully")


@router.get("/me", response_model=ResponseSchema[UserResponse])
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info (requires authentication)."""
    return ok(message="User retrieved successfully", item=current_user)


@router.put("/me", response_model=ResponseSchema[UserResponse])
async def update_current_user(
    update_data: UserUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Update current user profile info."""
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        return ok(message="No updates provided", item=current_user)
    updated_user = await update_user_db(db, current_user, update_dict)
    return ok(message="User updated successfully", item=updated_user)


@router.delete("/me", response_model=ResponseSchema[None])
async def delete_current_user(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Delete current user account."""
    await delete_user_db(db, current_user)
    return ok(message="User deleted successfully")


@router.post("/forgot-password", response_model=ResponseSchema[dict])
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Generate a one-time password for account recovery.

    In development, the OTP is returned in the payload for testing. In production,
    this should be emailed instead of returned directly to the client.
    """
    user = await get_user_by_email_db(db, payload.email)
    if not user:
        return ok(message="If an account exists for this email, a one-time password has been generated.")

    otp = generate_otp()
    expires_at = get_otp_expiration(minutes=settings.OTP_EXPIRE_MINUTES)
    await invalidate_user_password_reset_otps_db(db, user.id, commit=False)
    await create_password_reset_otp_db(db, user.id, hash_otp(otp), expires_at, commit=True)

    try:
        send_otp_email(user.email, otp, expires_minutes=settings.OTP_EXPIRE_MINUTES)
    except ValueError:
        if getattr(settings, "OTP_DEBUG_MODE", True):
            return ok(
                message="If an account exists for this email, a one-time password has been generated.",
                item={
                    "email": user.email,
                    "expires_in_minutes": settings.OTP_EXPIRE_MINUTES,
                    "otp": otp,
                },
            )
        raise AppException(error=AppError.SYS_DATABASE_UNAVAILABLE, custom_message="Email delivery is not configured for password reset.")

    return ok(
        message="If an account exists for this email, a one-time password has been generated.",
        item={
            "email": user.email,
            "expires_in_minutes": settings.OTP_EXPIRE_MINUTES,
            "otp": otp if getattr(settings, "OTP_DEBUG_MODE", True) else None,
        },
    )


@router.post("/verify-otp", response_model=ResponseSchema[dict])
async def verify_otp_endpoint(payload: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    """Validate an OTP generated for password recovery."""
    user = await get_user_by_email_db(db, payload.email)
    if not user:
        raise AppException(error=AppError.AUTH_USER_NOT_FOUND)

    otp_record = await get_valid_password_reset_otp_db(db, user.id, payload.otp)
    if not otp_record:
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS, custom_message="Invalid or expired OTP.")

    return ok(message="OTP verified successfully", item={"email": user.email, "verified": True})


@router.post("/reset-password", response_model=ResponseSchema[None])
async def reset_password_with_otp(payload: ResetPasswordWithOTP, db: AsyncSession = Depends(get_db)):
    """Reset a user's password using a valid OTP."""
    user = await get_user_by_email_db(db, payload.email)
    if not user:
        raise AppException(error=AppError.AUTH_USER_NOT_FOUND)

    otp_record = await get_valid_password_reset_otp_db(db, user.id, payload.otp)
    if not otp_record:
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS, custom_message="Invalid or expired OTP.")

    # Google-only accounts have no existing password to collide with.
    if user.hashed_password and verify_password(payload.new_password, user.hashed_password):
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS, custom_message="New password cannot be the same as the current password.")

    hashed_new = hash_password(payload.new_password)
    await update_user_db(db, user, {"hashed_password": hashed_new}, commit=False)
    await mark_password_reset_otp_used_db(db, otp_record, commit=False)
    await invalidate_user_password_reset_otps_db(db, user.id, commit=False)
    await db.commit()
    return ok(message="Password reset successfully")


@router.put("/change-password", response_model=ResponseSchema[None])
async def change_password(
    passwords: PasswordChange, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Change current user password."""
    if not current_user.hashed_password:
        raise AppException(
            error=AppError.AUTH_INVALID_CREDENTIALS,
            custom_message="This account signed up with Google and has no password yet. Use 'Forgot password' to set one.",
        )
    if not verify_password(passwords.current_password, current_user.hashed_password):
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS)
    
    hashed_new = hash_password(passwords.new_password)
    await update_user_db(db, current_user, {"hashed_password": hashed_new})
    return ok(message="Password changed successfully")