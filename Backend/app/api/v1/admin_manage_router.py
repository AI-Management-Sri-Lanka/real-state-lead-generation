from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.response import ok
from app.services.dependencies.deps import require_master_admin
from app.crud.user_crud import get_users_db, get_user_by_id_db, toggle_user_active_status_db

from app.crud.master_admin_crud import list_admins, toggle_admin_status

router = APIRouter(prefix="/admin/manage", tags=["Admin Management"])

from app.schemas.master_admin_schema import MasterAdminResponse

@router.get("/admins")
async def list_all_admins(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all Master Admins."""
    admins, total = await list_admins(db, skip=skip, limit=limit)
    admin_responses = [MasterAdminResponse.model_validate(admin) for admin in admins]
    return ok(item={"admins": admin_responses, "total": total, "skip": skip, "limit": limit})

@router.post("/admins/{admin_id}/toggle-status")
async def toggle_admin_access(
    admin_id: int = Path(...),
    is_active: bool = Query(...),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """Enable or disable another Master Admin."""
    if admin_id == _admin["admin_id"]:
        raise AppException(error=AppError.PERM_PERMISSION_DENIED, custom_message="You cannot deactivate yourself.")
        
    updated = await toggle_admin_status(db, admin_id, is_active)
    if not updated:
        raise AppException(error=AppError.AUTH_USER_NOT_FOUND, custom_message="Admin not found.")
        
    return ok(message=f"Admin status changed to active={is_active}")

from app.schemas.user_schema import UserResponse

@router.get("/users")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """View a paginated list of all users/property owners in the system."""
    users, total = await get_users_db(db, skip=skip, limit=limit)
    user_responses = [UserResponse.model_validate(u) for u in users]
    return ok(item={"users": user_responses, "total": total, "skip": skip, "limit": limit})

@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int = Path(...),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """View details for a single user."""
    user = await get_user_by_id_db(db, user_id)
    if not user:
        raise AppException(error=AppError.AUTH_USER_NOT_FOUND)
    return ok(item=UserResponse.model_validate(user))

@router.post("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int = Path(...),
    is_active: bool = Query(...),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """Activate or deactivate a user (e.g. ban a property owner)."""
    user = await toggle_user_active_status_db(db, user_id, is_active)
    if not user:
        raise AppException(error=AppError.AUTH_USER_NOT_FOUND)
    return ok(message=f"User status changed to active={is_active}", item=UserResponse.model_validate(user))

from app.services.property_manage.property_service import list_properties
from app.services.session_service import list_sessions, to_summary

@router.get("/properties")
async def list_all_properties(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """View all properties across all users."""
    properties = await list_properties(db, skip=skip, limit=limit)
    return ok(item={"properties": properties, "skip": skip, "limit": limit})

@router.get("/sessions")
async def list_all_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """View all chat sessions across all users."""
    sessions = await list_sessions(db, skip=skip, limit=limit)
    # Convert to summary schema to include message count
    session_summaries = [to_summary(session) for session in sessions]
    return ok(item={"sessions": session_summaries, "skip": skip, "limit": limit})
