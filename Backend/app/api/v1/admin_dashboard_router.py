from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.response import ok
from app.services.dependencies.deps import require_master_admin
from app.crud.dashboard_crud import get_platform_stats

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get high-level aggregate statistics across the platform."""
    stats = await get_platform_stats(db)
    return ok(item=stats)
