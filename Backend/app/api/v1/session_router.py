from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.schemas.session_schema import (
    SessionCreate, SessionOut, SessionSummary,
    MessageIn, MessageOut
)
from app.services import session_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionOut, status_code=201,
             summary="Create a new persistent user chat session")
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new chat history session for a given user.
    """
    return await session_service.create_session(db, body)


@router.get("", response_model=List[SessionSummary],
            summary="List all active chat sessions for a specific user")
async def list_sessions(
    user_id: Optional[int] = Query(None, description="Filter sessions by user ID"),
    db: AsyncSession = Depends(get_db)
):
    sessions = await session_service.list_sessions(db, user_id)
    return [session_service.to_summary(s) for s in sessions]


@router.get("/{session_id}", response_model=SessionOut,
            summary="Get a session details and its full chat message history")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    return await session_service.get_session(db, session_id)


@router.patch("/{session_id}", response_model=SessionOut,
              summary="Rename a chat session")
async def update_session(
    session_id: str,
    title: str = Query(..., description="The new title for the chat session"),
    db: AsyncSession = Depends(get_db)
):
    return await session_service.update_session(db, session_id, title)


@router.delete("/{session_id}", status_code=204,
               summary="Delete a chat session and all its message history")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    await session_service.delete_session(db, session_id)


@router.post("/{session_id}/messages", response_model=MessageOut, status_code=201,
             summary="Manually append a user or assistant message to history")
async def add_message(
    session_id: str,
    body: MessageIn,
    db: AsyncSession = Depends(get_db)
):
    return await session_service.add_message(db, session_id, body)


@router.get("/{session_id}/messages", response_model=List[MessageOut],
            summary="Get message history for a session")
async def get_messages(
    session_id: str,
    limit: int = Query(50, description="Max number of recent messages to return"),
    db: AsyncSession = Depends(get_db)
):
    session = await session_service.get_session(db, session_id)
    messages = session.messages or []
    return messages[-limit:]


@router.delete("/{session_id}/messages", status_code=204,
               summary="Clear chat history but keep the session metadata")
async def clear_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    await session_service.clear_messages(db, session_id)


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
    await session_service.add_message(db, session_id, body)

    # 2. Retrieve history to feed into AI
    session = await session_service.get_session(db, session_id)
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
    saved_ai_msg = await session_service.add_message(db, session_id, assistant_msg)

    return saved_ai_msg