from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db           # adjust to match your db dependency
from app.schemas.session_schema import (
    SessionCreate, SessionOut, SessionSummary,
    MessageIn, MessageOut, LeadProfileUpdate
)
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["sessions"])


# ── Create session ────────────────────────────────────────────────────────────
@router.post("", response_model=SessionOut, status_code=201,
             summary="Create a new chat session for a social media lead")
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Call this as soon as a lead starts chatting from FB / Instagram / TikTok.
    Returns a session_id — store it and send it with every follow-up message.
    """
    return await SessionService.create_session(db, body)


# ── List sessions ─────────────────────────────────────────────────────────────
@router.get("", response_model=List[SessionSummary],
            summary="List all active sessions (optionally filter by platform)")
async def list_sessions(
    platform: Optional[str] = Query(None, example="facebook"),
    db: AsyncSession = Depends(get_db)
):
    sessions = await SessionService.list_sessions(db, platform)
    return [
        {
            "session_id": s.id,
            "platform": s.platform,
            "platform_user_id": s.platform_user_id,
            "lead_name": s.lead_name,
            "message_count": len(s.messages or []),
            "updated_at": s.updated_at,
            "expires_at": s.expires_at,
        }
        for s in sessions
    ]


# ── Get session ───────────────────────────────────────────────────────────────
@router.get("/{session_id}", response_model=SessionOut,
            summary="Get full session including chat history and lead profile")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    return await SessionService.get_session(db, session_id)


# ── Delete session ────────────────────────────────────────────────────────────
@router.delete("/{session_id}", status_code=204,
               summary="End and delete a session")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    await SessionService.delete_session(db, session_id)


# ── Add message ───────────────────────────────────────────────────────────────
@router.post("/{session_id}/messages", status_code=201,
             summary="Append a user or assistant message to the chat history")
async def add_message(
    session_id: str,
    body: MessageIn,
    db: AsyncSession = Depends(get_db)
):
    """
    Call this after every chat turn — once for the user message,
    once for the assistant reply. Feed the history back to the AI on each call.
    """
    return await SessionService.add_message(db, session_id, body)


# ── Get messages ──────────────────────────────────────────────────────────────
@router.get("/{session_id}/messages",
            summary="Get chat history for a session")
async def get_messages(
    session_id: str,
    limit: int = Query(50, description="Max number of recent messages to return"),
    db: AsyncSession = Depends(get_db)
):
    session = await SessionService.get_session(db, session_id)
    messages = session.messages or []
    return messages[-limit:]


# ── Clear messages ────────────────────────────────────────────────────────────
@router.delete("/{session_id}/messages", status_code=204,
               summary="Clear chat history but keep the session and lead profile")
async def clear_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    await SessionService.clear_messages(db, session_id)


# ── Update lead profile ───────────────────────────────────────────────────────
@router.patch("/{session_id}/lead",
              summary="Update buyer profile as chatbot learns more during conversation")
async def update_lead(
    session_id: str,
    body: LeadProfileUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    As the buyer reveals their budget, location, preferences etc. mid-chat,
    update their profile without starting a new session.
    """
    return await SessionService.update_lead(db, session_id, body)