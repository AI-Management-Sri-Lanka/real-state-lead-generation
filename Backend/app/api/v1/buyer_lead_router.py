from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.buyer_lead_schema import BuyerLeadCreate, BuyerLeadResponse, BuyerLeadListResponse
from app.schemas.response_schema import ResponseSchema
from app.services.buyer_lead.buyer_lead_service import (
    submit_buyer_lead,
    fetch_buyer_lead,
    fetch_buyer_leads,
    remove_buyer_lead,
)
from app.db.session import get_db
from app.core.response import ok
from app.core.errors import AppException, AppError
from app.services.dependencies.deps import require_master_admin

router = APIRouter(prefix="/buyer-leads", tags=["buyer-leads"])


@router.post(
    "",
    response_model=ResponseSchema[BuyerLeadResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_buyer_lead_endpoint(
    lead_data: BuyerLeadCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a new buyer lead qualification form (public endpoint)."""
    try:
        lead = await submit_buyer_lead(db, lead_data)
        return ok(message="Buyer lead submitted successfully", item=lead)
    except Exception as e:
        await db.rollback()
        raise e


@router.get(
    "",
    response_model=ResponseSchema[BuyerLeadListResponse],
)
async def list_buyer_leads_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_master_admin),
):
    """List all buyer leads with pagination (admin only)."""
    result = await fetch_buyer_leads(db, skip=skip, limit=limit)
    return ok(message="Buyer leads retrieved successfully", item=result)


@router.get(
    "/{lead_id}",
    response_model=ResponseSchema[BuyerLeadResponse],
)
async def get_buyer_lead_endpoint(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_master_admin),
):
    """Get a specific buyer lead by ID (admin only)."""
    lead = await fetch_buyer_lead(db, lead_id)
    if lead is None:
        raise AppException(
            error=AppError.SYS_RESOURCE_NOT_FOUND,
            custom_message=f"Buyer lead with ID {lead_id} not found",
        )
    return ok(message="Buyer lead retrieved successfully", item=lead)


@router.delete(
    "/{lead_id}",
    response_model=ResponseSchema[None],
)
async def delete_buyer_lead_endpoint(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_master_admin),
):
    """Delete a buyer lead by ID (admin only)."""
    lead = await remove_buyer_lead(db, lead_id)
    if lead is None:
        raise AppException(
            error=AppError.SYS_RESOURCE_NOT_FOUND,
            custom_message=f"Buyer lead with ID {lead_id} not found",
        )
    return ok(message="Buyer lead deleted successfully")