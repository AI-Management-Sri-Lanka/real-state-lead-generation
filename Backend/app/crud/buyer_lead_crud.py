from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.engine import Result

from app.models.buyer_lead import BuyerLead
from app.schemas.buyer_lead_schema import BuyerLeadCreate


async def create_buyer_lead(
    db: AsyncSession, lead_data: BuyerLeadCreate, commit: bool = True
) -> BuyerLead:
    """Create a new buyer lead in the database."""
    db_lead = BuyerLead(**lead_data.model_dump())
    db.add(db_lead)
    if commit:
        await db.commit()
        await db.refresh(db_lead)
    else:
        await db.flush()
    return db_lead


async def get_buyer_lead(db: AsyncSession, lead_id: int) -> BuyerLead | None:
    """Get a single buyer lead by ID."""
    result: Result = await db.execute(
        select(BuyerLead).where(BuyerLead.id == lead_id)
    )
    return result.scalar_one_or_none()


async def get_buyer_leads(
    db: AsyncSession, skip: int = 0, limit: int = 100
) -> list[BuyerLead]:
    """Get a paginated list of buyer leads, newest first."""
    result: Result = await db.execute(
        select(BuyerLead)
        .order_by(BuyerLead.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_buyer_leads_count(db: AsyncSession) -> int:
    """Get the total count of buyer leads."""
    result: Result = await db.execute(select(func.count(BuyerLead.id)))
    return result.scalar() or 0


async def delete_buyer_lead(
    db: AsyncSession, lead_id: int, commit: bool = True
) -> BuyerLead | None:
    """Delete a buyer lead by ID. Returns the deleted lead or None."""
    db_lead = await get_buyer_lead(db, lead_id)
    if db_lead:
        await db.delete(db_lead)
        if commit:
            await db.commit()
        else:
            await db.flush()
    return db_lead