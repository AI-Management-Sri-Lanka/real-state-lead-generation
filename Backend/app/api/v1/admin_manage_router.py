from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.response import ok
from app.core.errors import AppException, AppError
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

@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int = Path(...),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """Permanently delete a user account and all their data."""
    from app.crud.user_crud import get_user_by_id_db, delete_user_db
    user = await get_user_by_id_db(db, user_id)
    if not user:
        raise AppException(error=AppError.AUTH_USER_NOT_FOUND)
    await delete_user_db(db, user)

from app.services.property_manage.property_service import list_properties
from app.services.session_service import list_sessions, to_summary
from app.schemas.properties_schema import PropertyResponse

@router.get("/properties")
async def list_all_properties(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """View all properties across all users (serialized)."""
    properties = await list_properties(db, skip=skip, limit=limit)
    serialized = [PropertyResponse.model_validate(p).model_dump(by_alias=True) for p in properties]
    return ok(item={"properties": serialized, "total": len(serialized), "skip": skip, "limit": limit})

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


from app.schemas.response_schema import ResponseSchema
from app.schemas.session_schema import MessageOut
from app.services.session_service import get_session
from typing import List

@router.get("/sessions/{session_id}/messages", response_model=ResponseSchema[List[MessageOut]])
async def get_session_messages(
    session_id: str = Path(...),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """View full transcript of a specific chat session."""
    session = await get_session(db, session_id)
    return ok(item=session.messages)


from sqlalchemy import select, func, desc
from sqlalchemy.orm import joinedload
from app.models.inquiry import Inquiry

@router.get("/inquiries")
async def list_all_inquiries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """View all inquiries/leads across the entire platform."""
    # Count total
    total = await db.scalar(select(func.count(Inquiry.id))) or 0
    
    # Get inquiries with property eager loaded
    query = (
        select(Inquiry)
        .options(joinedload(Inquiry.property))
        .order_by(desc(Inquiry.created_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    inquiries = result.scalars().all()
    
    # Map to schema
    inquiry_responses = []
    for inc in inquiries:
        inquiry_responses.append({
            "id": inc.id,
            "property_id": inc.property_id,
            "property_title": inc.property.title if inc.property else None,
            "name": inc.name,
            "email": inc.email,
            "phone": inc.phone,
            "message": inc.message,
            "source": inc.source,
            "created_at": inc.created_at
        })
        
    return ok(item={"inquiries": inquiry_responses, "total": total, "skip": skip, "limit": limit})
