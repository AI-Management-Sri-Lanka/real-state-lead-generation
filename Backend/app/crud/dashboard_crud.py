from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user import User
from app.models.properties import Property
from app.models.session import Session

async def get_platform_stats(db: AsyncSession) -> dict:
    """Get aggregate statistics across the platform."""
    
    users_query = select(func.count(User.id))
    properties_query = select(func.count(Property.id))
    sessions_query = select(func.count(Session.id))
    
    total_users = await db.scalar(users_query)
    total_properties = await db.scalar(properties_query)
    total_sessions = await db.scalar(sessions_query)
    
    return {
        "total_users": total_users or 0,
        "total_properties": total_properties or 0,
        "total_chat_sessions": total_sessions or 0
    }
