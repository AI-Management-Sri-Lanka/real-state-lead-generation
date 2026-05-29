from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from fastapi import HTTPException

from app.models.session import Session, Message
from app.schemas.session_schema import SessionCreate, MessageIn


class SessionService:

    @staticmethod
    async def create_session(db: AsyncSession, body: SessionCreate) -> Session:
        session = Session(
            user_id=body.user_id,
            title=body.title or "New Chat"
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def get_session(db: AsyncSession, session_id: str) -> Session:
        result = await db.execute(select(Session).where(Session.id == session_id))
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if datetime.utcnow() > session.expires_at:
            await db.delete(session)
            await db.commit()
            raise HTTPException(status_code=410, detail="Session expired")
        return session

    @staticmethod
    async def list_sessions(db: AsyncSession, user_id: int = None) -> list:
        query = select(Session).where(Session.expires_at > datetime.utcnow())
        if user_id is not None:
            query = query.where(Session.user_id == user_id)
        query = query.order_by(Session.updated_at.desc())
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def delete_session(db: AsyncSession, session_id: str):
        session = await SessionService.get_session(db, session_id)
        await db.delete(session)
        await db.commit()

    @staticmethod
    async def add_message(db: AsyncSession, session_id: str, msg: MessageIn) -> Message:
        if msg.role not in ("user", "assistant"):
            raise HTTPException(status_code=422, detail="role must be 'user' or 'assistant'")
        session = await SessionService.get_session(db, session_id)
        new_msg = Message(
            session_id=session_id,
            role=msg.role,
            content=msg.content,
            timestamp=datetime.utcnow()
        )
        db.add(new_msg)
        session.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(new_msg)
        return new_msg

    @staticmethod
    async def clear_messages(db: AsyncSession, session_id: str):
        session = await SessionService.get_session(db, session_id)
        session.messages = []
        session.updated_at = datetime.utcnow()
        await db.commit()

    @staticmethod
    async def update_session(db: AsyncSession, session_id: str, title: str) -> Session:
        session = await SessionService.get_session(db, session_id)
        session.title = title
        session.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(session)
        return session