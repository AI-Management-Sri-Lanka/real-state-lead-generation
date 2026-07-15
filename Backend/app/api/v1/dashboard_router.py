from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.session import Session
from app.models.message import Message
from app.schemas.response_schema import ResponseSchema
from app.services.dependencies.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["User Dashboard"])

@router.get("/stats")
async def get_user_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve chat session and query statistics for the currently logged-in user."""
    user_id = current_user.id
    
    # 1. Total sessions
    total_sessions = await db.scalar(
        select(func.count(Session.id)).where(Session.user_id == user_id)
    ) or 0

    # 2. Sessions today (last 24 hours)
    one_day_ago = datetime.utcnow() - timedelta(days=1)
    sessions_today = await db.scalar(
        select(func.count(Session.id)).where(
            and_(Session.user_id == user_id, Session.created_at >= one_day_ago)
        )
    ) or 0

    # 3. Active sessions (updated in last 12 hours)
    twelve_hours_ago = datetime.utcnow() - timedelta(hours=12)
    active_sessions = await db.scalar(
        select(func.count(Session.id)).where(
            and_(Session.user_id == user_id, Session.updated_at >= twelve_hours_ago)
        )
    ) or 0

    # 4. Total messages
    total_messages = await db.scalar(
        select(func.count(Message.id))
        .join(Session)
        .where(Session.user_id == user_id)
    ) or 0

    stats = {
        "total_sessions": total_sessions,
        "sessions_today": sessions_today,
        "active_sessions": active_sessions,
        "total_messages": total_messages
    }

    return ResponseSchema(success=True, message="User dashboard stats retrieved successfully", data=stats)
