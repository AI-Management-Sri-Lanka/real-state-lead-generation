from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date
from pydantic import BaseModel

from app.db.session import get_db
from app.models.session import Session, Message
from app.models.user import User
from app.services.dependencies.deps import get_current_user
from app.schemas.response_schema import ResponseSchema
from app.core.response import ok

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardStats(BaseModel):
    total_sessions: int
    sessions_today: int
    active_sessions: int
    total_messages: int


@router.get("/stats", response_model=ResponseSchema[DashboardStats])
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today_start = datetime.combine(date.today(), datetime.min.time())

    total_sessions = (await db.execute(
        select(func.count(Session.id)).where(Session.user_id == current_user.id)
    )).scalar_one()

    sessions_today = (await db.execute(
        select(func.count(Session.id)).where(
            Session.user_id == current_user.id,
            Session.created_at >= today_start,
        )
    )).scalar_one()

    active_sessions = (await db.execute(
        select(func.count(Session.id)).where(
            Session.user_id == current_user.id,
            Session.expires_at > datetime.utcnow(),
        )
    )).scalar_one()

    total_messages = (await db.execute(
        select(func.count(Message.id))
        .join(Session, Message.session_id == Session.id)
        .where(Session.user_id == current_user.id, Message.role == "user")
    )).scalar_one()

    return ok(
        message="Dashboard stats retrieved",
        item=DashboardStats(
            total_sessions=total_sessions,
            sessions_today=sessions_today,
            active_sessions=active_sessions,
            total_messages=total_messages,
        ),
    )
