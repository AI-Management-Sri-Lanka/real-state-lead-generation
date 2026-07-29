from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.core.response import ok
from app.schemas.response_schema import ResponseSchema
from app.schemas.leads_schema import LeadResponse, LeadsStats
from app.services.leads import leads_service
from app.services.dependencies.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/leads", tags=["Leads"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=ResponseSchema[List[LeadResponse]])
async def list_leads(
    limit: int = Query(10, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leads = await leads_service.list_leads(db, current_user.id, limit=limit)
    return ok(message="Leads retrieved successfully", item=leads)


@router.get("/stats", response_model=ResponseSchema[LeadsStats])
async def leads_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats = await leads_service.get_stats(db, current_user.id)
    return ok(message="Lead stats retrieved successfully", item=stats)
