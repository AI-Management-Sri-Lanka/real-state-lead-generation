from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.master_admin_schema import MasterAdminCreate, MasterAdminLogin, MasterAdminResponse
from app.schemas.response_schema import ResponseSchema
from app.crud.master_admin_crud import has_any_admins, create_admin, get_admin_by_email
from app.core.security import verify_password, create_master_admin_token, create_master_admin_refresh_token, decode_token
from app.core.errors import AppException, AppError
from app.core.response import ok
from app.schemas.token_schema import RefreshTokenRequest
from app.crud.token_crud import create_master_admin_refresh_token_db, get_master_admin_refresh_token_db, revoke_master_admin_refresh_token_db, add_blacklisted_token
from datetime import datetime, timedelta
from app.core.config import settings
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth"])

@router.post("/bootstrap", response_model=ResponseSchema[MasterAdminResponse])
async def bootstrap_master_admin(body: MasterAdminCreate, db: AsyncSession = Depends(get_db)):
    """Create the very first master admin. Locks after first use."""
    if await has_any_admins(db):
        raise AppException(error=AppError.PERM_PERMISSION_DENIED, custom_message="Setup is already complete.")
    
    new_admin = await create_admin(db, body)
    return ok(message="Initial Master Admin account created successfully", item=new_admin)

@router.post("/login")
async def master_admin_login(body: MasterAdminLogin, db: AsyncSession = Depends(get_db)):
    """Login for Master Admins."""
    admin = await get_admin_by_email(db, body.email)
    
    if not admin or not verify_password(body.password, admin.hashed_password):
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS)
        
    if not admin.is_active:
        raise AppException(error=AppError.PERM_PERMISSION_DENIED, custom_message="Account deactivated.")
        
    access_token = create_master_admin_token(admin.id, admin.email)
    refresh_token = create_master_admin_refresh_token(admin.id, admin.email)
    
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await create_master_admin_refresh_token_db(db, admin.id, refresh_token, expires_at)
    
    return ok(item={
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name
        }
    })

@router.post("/refresh")
async def refresh_admin_token(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh the master admin access token using a refresh token."""
    try:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh" or not payload.get("is_master_admin"):
            raise ValueError("Invalid token type")
        admin_id_str = payload.get("sub")
        admin_email = payload.get("email")
        if not admin_id_str or not admin_email:
            raise ValueError("Token missing subject or email")
        admin_id = int(admin_id_str)
    except Exception:
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS)

    db_token = await get_master_admin_refresh_token_db(db, request.refresh_token)
    if not db_token or db_token.is_revoked or db_token.expires_at < datetime.utcnow():
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS)

    try:
        await revoke_master_admin_refresh_token_db(db, request.refresh_token, commit=False)
        access_token = create_master_admin_token(admin_id, admin_email)
        refresh_token = create_master_admin_refresh_token(admin_id, admin_email)
        expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await create_master_admin_refresh_token_db(db, admin_id, refresh_token, expires_at, commit=False)
        await db.commit()
        return ok(message="Token refreshed successfully", item={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        })
    except Exception as e:
        await db.rollback()
        raise e

@router.post("/logout")
async def logout_admin(
    request: RefreshTokenRequest, 
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
):
    """Logout the master admin by revoking the refresh token and blacklisting the access token."""
    db_token = await get_master_admin_refresh_token_db(db, request.refresh_token)
    if not db_token or db_token.is_revoked:
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS, custom_message="Invalid or already revoked refresh token")

    await revoke_master_admin_refresh_token_db(db, request.refresh_token)
    
    if credentials and credentials.credentials:
        await add_blacklisted_token(db, credentials.credentials)
        
    return ok(message="Logged out successfully")

from app.services.dependencies.deps import require_master_admin
from app.schemas.master_admin_schema import MasterAdminUpdate, MasterAdminPasswordChange
from app.crud.master_admin_crud import get_admin_by_id, update_admin

@router.get("/me", response_model=ResponseSchema[MasterAdminResponse])
async def get_current_admin(
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get the current admin's profile info."""
    admin_record = await get_admin_by_id(db, _admin["admin_id"])
    if not admin_record:
        raise AppException(error=AppError.AUTH_USER_NOT_FOUND)
    return ok(item=admin_record)

@router.post("/create-admin", response_model=ResponseSchema[MasterAdminResponse])
async def create_new_admin(
    body: MasterAdminCreate,
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """Allow an existing admin to create another admin account."""
    existing = await get_admin_by_email(db, body.email)
    if existing:
        raise AppException(error=AppError.AUTH_EMAIL_EXISTS)
        
    new_admin = await create_admin(db, body)
    return ok(message="Master Admin account created successfully", item=new_admin)

@router.put("/me", response_model=ResponseSchema[MasterAdminResponse])
async def update_current_admin(
    body: MasterAdminUpdate,
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update current admin's profile."""
    admin_record = await get_admin_by_id(db, _admin["admin_id"])
    if not admin_record:
        raise AppException(error=AppError.AUTH_USER_NOT_FOUND)
        
    updated = await update_admin(db, admin_record, body.model_dump(exclude_unset=True))
    return ok(message="Profile updated successfully", item=updated)

@router.put("/change-password")
async def change_admin_password(
    body: MasterAdminPasswordChange,
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """Change current admin's password."""
    admin_record = await get_admin_by_id(db, _admin["admin_id"])
    if not admin_record or not verify_password(body.current_password, admin_record.hashed_password):
        raise AppException(error=AppError.AUTH_INVALID_CREDENTIALS)
        
    from app.core.security import hash_password
    hashed_new = hash_password(body.new_password)
    await update_admin(db, admin_record, {"hashed_password": hashed_new})
    return ok(message="Password changed successfully")
