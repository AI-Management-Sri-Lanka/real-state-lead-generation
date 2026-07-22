from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.master_admin_schema import MasterAdminCreate, MasterAdminLogin, MasterAdminResponse
from app.schemas.response_schema import ResponseSchema
from app.crud.master_admin_crud import has_any_admins, create_admin, get_admin_by_email
from app.core.security import verify_password, create_master_admin_token
from app.core.errors import AppException, AppError
from app.core.response import ok

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
        
    token = create_master_admin_token(admin.id, admin.email)
    
    return ok(item={
        "access_token": token, 
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name
        }
    })

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
