from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime
from fastapi import HTTPException

from app.models.session import Session
from app.schemas.session_schema import SessionCreate, LeadProfileUpdate, MessageIn


class SessionService:

    @staticmethod
    async def create_session(db: AsyncSession, body: SessionCreate) -> Session:
        session = Session(
            platform=body.lead.platform,
            platform_user_id=body.lead.platform_user_id,
            lead_name=body.lead.lead_name,
            lead_profile=body.lead.model_dump(),
            messages=[]
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
    async def list_sessions(db: AsyncSession, platform: str = None) -> list:
        query = select(Session).where(Session.expires_at > datetime.utcnow())
        if platform:
            query = query.where(Session.platform == platform)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def delete_session(db: AsyncSession, session_id: str):
        session = await SessionService.get_session(db, session_id)
        await db.delete(session)
        await db.commit()

    @staticmethod
    async def add_message(db: AsyncSession, session_id: str, msg: MessageIn) -> dict:
        if msg.role not in ("user", "assistant"):
            raise HTTPException(status_code=422, detail="role must be 'user' or 'assistant'")
        session = await SessionService.get_session(db, session_id)
        new_msg = {
            "role": msg.role,
            "content": msg.content,
            "timestamp": datetime.utcnow().isoformat()
        }
        messages = list(session.messages or [])
        messages.append(new_msg)
        session.messages = messages
        session.updated_at = datetime.utcnow()
        await db.commit()
        return new_msg

    @staticmethod
    async def clear_messages(db: AsyncSession, session_id: str):
        session = await SessionService.get_session(db, session_id)
        session.messages = []
        session.updated_at = datetime.utcnow()
        await db.commit()

    @staticmethod
    async def update_lead(db: AsyncSession, session_id: str, updates: LeadProfileUpdate) -> dict:
        session = await SessionService.get_session(db, session_id)
        profile = dict(session.lead_profile or {})
        for field, value in updates.model_dump(exclude_none=True).items():
            if field == "extra":
                profile["extra"] = {**profile.get("extra", {}), **value}
            else:
                profile[field] = value
        session.lead_profile = profile
        session.lead_name = profile.get("lead_name", session.lead_name)
        session.updated_at = datetime.utcnow()
        await db.commit()
        return profile