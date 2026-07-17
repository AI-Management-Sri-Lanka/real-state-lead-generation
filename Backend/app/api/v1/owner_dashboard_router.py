from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.inquiry_schema import OwnerDashboardStats, InquiryResponse
from app.schemas.response_schema import ResponseSchema
from app.services.inquiry_service import inquiry_service
from app.services.dependencies.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/dashboard/owner", tags=["Owner Dashboard"])

@router.get("/stats", response_model=ResponseSchema[OwnerDashboardStats])
async def get_owner_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve aggregate inquiries/leads statistics for properties owned by the authenticated user."""
    stats = await inquiry_service.get_owner_stats(db, current_user.id)
    return ResponseSchema(success=True, message="Dashboard stats retrieved successfully", data=stats)

@router.get("/inquiries", response_model=ResponseSchema[list[InquiryResponse]])
async def get_owner_inquiries(
    propertyId: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve inquiries/leads for properties owned by the authenticated user."""
    inquiries = await inquiry_service.get_owner_inquiries(db, current_user.id, propertyId)
    return ResponseSchema(success=True, message="Inquiries retrieved successfully", data=inquiries)
