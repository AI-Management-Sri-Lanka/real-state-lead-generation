from sqlalchemy.ext.asyncio import AsyncSession

from app.models.buyer_lead import BuyerLead
from app.schemas.buyer_lead_schema import BuyerLeadCreate, BuyerLeadResponse, BuyerLeadListResponse
from app.crud.buyer_lead_crud import (
    create_buyer_lead,
    get_buyer_lead,
    get_buyer_leads,
    get_buyer_leads_count,
    delete_buyer_lead,
)


async def submit_buyer_lead(
    db: AsyncSession, lead_data: BuyerLeadCreate
) -> BuyerLeadResponse:
    """Process and store a new buyer lead submission."""
    db_lead = await create_buyer_lead(db, lead_data)
    return BuyerLeadResponse.model_validate(db_lead)


async def fetch_buyer_lead(
    db: AsyncSession, lead_id: int
) -> BuyerLeadResponse | None:
    """Fetch a single buyer lead by ID."""
    db_lead = await get_buyer_lead(db, lead_id)
    if db_lead is None:
        return None
    return BuyerLeadResponse.model_validate(db_lead)


async def fetch_buyer_leads(
    db: AsyncSession, skip: int = 0, limit: int = 100
) -> BuyerLeadListResponse:
    """Fetch a paginated list of buyer leads."""
    leads = await get_buyer_leads(db, skip=skip, limit=limit)
    total = await get_buyer_leads_count(db)
    return BuyerLeadListResponse(
        items=[BuyerLeadResponse.model_validate(lead) for lead in leads],
        total=total,
        skip=skip,
        limit=limit,
    )


async def remove_buyer_lead(
    db: AsyncSession, lead_id: int
) -> BuyerLeadResponse | None:
    """Delete a buyer lead by ID."""
    db_lead = await delete_buyer_lead(db, lead_id)
    if db_lead is None:
        return None
    return BuyerLeadResponse.model_validate(db_lead)