from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.services.ai.title_generator import TitleGenerator
from app.models.session import Session
from app.models.message import Message


async def is_first_message(db: AsyncSession, session_id: str) -> bool:
    """
    Return True if the session has no messages yet (i.e. this is the first user message).
    Uses a COUNT query to avoid loading all messages into memory.
    """
    result = await db.execute(
        select(func.count()).select_from(Message).where(Message.session_id == session_id)
    )
    count = result.scalar_one()
    return count == 0


async def generate_and_save_title(db: AsyncSession, session_id: str, user_query: str) -> str:
    """
    Generate a meaningful chat title from the user's first message using the LLM
    and persist it to the session row in the database.

    Args:
        db: The async database session.
        session_id: The ID of the chat session to update.
        user_query: The first message text from the user.

    Returns:
        The generated title string.
    """
    title = await TitleGenerator().generate(user_query)

    await db.execute(
        Session.__table__.update()
        .where(Session.id == session_id)
        .values(title=title, updated_at=datetime.utcnow())
    )
    await db.commit()

    return title
