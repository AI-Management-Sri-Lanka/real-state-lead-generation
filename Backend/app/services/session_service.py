from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from datetime import datetime
from fastapi import HTTPException

from app.models.session import Session
from app.models.message import Message
from app.schemas.session_schema import SessionCreate, MessageIn, SessionSummary


def _with_messages():
    """Reusable selectinload option for eager-loading messages in async context."""
    return selectinload(Session.messages)


async def create_session(db: AsyncSession, body: SessionCreate) -> Session:
    session = Session(
        user_id=body.user_id,
        title=body.title or "New Chat",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(db: AsyncSession, session_id: str) -> Session:
    """Fetch a session with its messages eagerly loaded. Raises 404 or 410."""
    result = await db.execute(
        select(Session)
        .options(_with_messages())
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session


async def list_sessions(db: AsyncSession, user_id: int | None = None, skip: int = 0, limit: int = 100) -> list[Session]:
    """List non-expired sessions, newest first. Eagerly loads messages for message_count."""
    query = select(Session).options(_with_messages())
    if user_id is not None:
        query = query.where(Session.user_id == user_id)
    query = query.order_by(Session.updated_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def update_session(db: AsyncSession, session_id: str, title: str) -> Session:
    session = await get_session(db, session_id)
    session.title = title
    session.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(session)
    return session


async def delete_session(db: AsyncSession, session_id: str) -> None:
    session = await get_session(db, session_id)
    await db.delete(session)  # cascade deletes messages via FK ondelete=CASCADE
    await db.commit()


async def add_message(db: AsyncSession, session_id: str, msg: MessageIn) -> Message:
    if msg.role not in ("user", "assistant"):
        raise HTTPException(status_code=422, detail="role must be 'user' or 'assistant'")

    await get_session(db, session_id)  # validate exists and not expired

    new_msg = Message(
        session_id=session_id,
        role=msg.role,
        content=msg.content,
        timestamp=datetime.utcnow(),
    )
    db.add(new_msg)
    await db.execute(
        Session.__table__.update()
        .where(Session.id == session_id)
        .values(updated_at=datetime.utcnow())
    )
    await db.commit()
    await db.refresh(new_msg)
    return new_msg


async def clear_messages(db: AsyncSession, session_id: str) -> None:
    """Delete all messages for a session using a DELETE statement (safe in async)."""
    await get_session(db, session_id)  # validate exists and not expired

    await db.execute(
        delete(Message).where(Message.session_id == session_id)
    )
    await db.execute(
        Session.__table__.update()
        .where(Session.id == session_id)
        .values(updated_at=datetime.utcnow())
    )
    await db.commit()


def derive_title(session: Session) -> str:
    """Derive a chat title from the first user message if the title is default/empty."""
    title = session.title
    if (not title or title.strip().lower() == "new chat") and session.messages:
        # Find first user message
        first_user_msg = next((m for m in session.messages if m.role == "user"), None)
        if first_user_msg and first_user_msg.content.strip():
            snippet = first_user_msg.content.strip().replace("\n", " ").replace("\r", " ")
            snippet = " ".join(snippet.split())
            if len(snippet) > 30:
                title = snippet[:30] + "..."
            else:
                title = snippet
    return title or "New Chat"


def to_out_dict(session: Session) -> dict:
    """Convert a Session ORM object to a dict matching SessionOut schema with derived title."""
    return {
        "session_id": session.id,
        "user_id": session.user_id,
        "title": derive_title(session),
        "messages": session.messages,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }


def to_summary(session: Session) -> SessionSummary:
    """Convert a Session ORM object to a SessionSummary schema."""
    return SessionSummary(
        session_id=session.id,
        user_id=session.user_id,
        title=derive_title(session),
        message_count=len(session.messages),
        updated_at=session.updated_at,
    )