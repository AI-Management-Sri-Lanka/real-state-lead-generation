from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.schemas.session_schema import (
    SessionCreate, SessionOut, SessionSummary,
    MessageIn, MessageOut
)
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["sessions"])


# ── Create session ────────────────────────────────────────────────────────────
@router.post("", response_model=SessionOut, status_code=201,
             summary="Create a new persistent user chat session")
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new chat history session for a given user.
    """
    return await SessionService.create_session(db, body)


# ── List sessions ─────────────────────────────────────────────────────────────
@router.get("", response_model=List[SessionSummary],
            summary="List all active chat sessions for a specific user")
async def list_sessions(
    user_id: Optional[int] = Query(None, description="Filter sessions by user ID"),
    db: AsyncSession = Depends(get_db)
):
    sessions = await SessionService.list_sessions(db, user_id)
    return [
        {
            "session_id": s.id,
            "user_id": s.user_id,
            "title": s.title,
            "message_count": len(s.messages or []),
            "updated_at": s.updated_at,
            "expires_at": s.expires_at,
        }
        for s in sessions
    ]


# ── Get session ───────────────────────────────────────────────────────────────
@router.get("/{session_id}", response_model=SessionOut,
            summary="Get a session details and its full chat message history")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    return await SessionService.get_session(db, session_id)


# ── Update session title (Rename) ─────────────────────────────────────────────
@router.patch("/{session_id}", response_model=SessionOut,
              summary="Rename a chat session")
async def update_session(
    session_id: str,
    title: str = Query(..., description="The new title for the chat session"),
    db: AsyncSession = Depends(get_db)
):
    return await SessionService.update_session(db, session_id, title)


# ── Delete session ────────────────────────────────────────────────────────────
@router.delete("/{session_id}", status_code=204,
               summary="Delete a chat session and all its message history")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    await SessionService.delete_session(db, session_id)


# ── Add message manually ──────────────────────────────────────────────────────
@router.post("/{session_id}/messages", response_model=MessageOut, status_code=201,
             summary="Manually append a user or assistant message to history")
async def add_message(
    session_id: str,
    body: MessageIn,
    db: AsyncSession = Depends(get_db)
):
    return await SessionService.add_message(db, session_id, body)


# ── Get messages ──────────────────────────────────────────────────────────────
@router.get("/{session_id}/messages", response_model=List[MessageOut],
            summary="Get message history for a session")
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
               summary="Clear chat history but keep the session metadata")
async def clear_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    await SessionService.clear_messages(db, session_id)


# ── Interactive AI Chat Endpoint ──────────────────────────────────────────────
@router.post("/{session_id}/chat", response_model=MessageOut, status_code=201,
             summary="Send a message to the AI assistant and get a response stored in DB")
async def chat_with_assistant(
    session_id: str,
    body: MessageIn,
    db: AsyncSession = Depends(get_db)
):
    """
    Sends a user message, saves it, queries the LangChain DirectChatTool to
    generate the assistant reply, saves the assistant reply, and returns it.
    """
    # 1. Save user message to database
    await SessionService.add_message(db, session_id, body)

    # 2. Retrieve history to feed into AI
    session = await SessionService.get_session(db, session_id)
    history_str = ""
    for m in session.messages[:-1]:  # exclude the user message we just added
        history_str += f"{m.role.capitalize()}: {m.content}\n"

    # 3. Call DirectChatTool
    try:
        from app.services.ai.simple_chat import DirectChatTool
        chat_tool = DirectChatTool()
        ai_reply = chat_tool.chat(user_query=body.content, session_history=history_str)
    except Exception as e:
        # Fallback response when OpenAI / LangChain fails or is not configured
        ai_reply = f"I'm processing your search request for Sri Lanka real estate. (Running in demo mode: {str(e)})"

    # 4. Save AI assistant message to database
    assistant_msg = MessageIn(role="assistant", content=ai_reply)
    saved_ai_msg = await SessionService.add_message(db, session_id, assistant_msg)

    return saved_ai_msg