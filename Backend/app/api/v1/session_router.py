from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.schemas.session_schema import (
    SessionCreate, SessionCreateRequest, SessionOut, SessionSummary,
    MessageIn, MessageOut, TitleGenerateRequest, TitleGenerateResponse
)
from app.services import session_service, title_service
from app.models.user import User
from app.services.dependencies.deps import get_current_user

router = APIRouter(
    prefix="/sessions", 
    tags=["sessions"],
)


async def get_owned_session(
    session_id: str,
    db: AsyncSession,
    current_user: User,
) -> object:
    """Fetch a session and verify it belongs to the current user."""
    session = await session_service.get_session(db, session_id)
    if session.user_id != current_user.id:
        # Return 404 instead of 403 to avoid leaking existence of sessions
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("", response_model=SessionOut, status_code=201,
             summary="Create a new persistent chat session for the current user")
async def create_session(
    body: SessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a new chat history session scoped to the authenticated user.
    The `user_id` is derived from the JWT token — do not send it in the request body.
    """
    # Build the internal schema with the authenticated user's ID from the JWT
    session_data = SessionCreate(user_id=current_user.id, title=body.title)
    session = await session_service.create_session(db, session_data)
    return session_service.to_out_dict(session)


@router.get("", response_model=List[SessionSummary],
            summary="List all chat sessions for the current authenticated user")
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns only sessions that belong to the currently authenticated user."""
    sessions = await session_service.list_sessions(db, user_id=current_user.id)
    return [session_service.to_summary(s) for s in sessions]


@router.get("/{session_id}", response_model=SessionOut,
            summary="Get a session's details and full chat message history")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the session only if it belongs to the authenticated user."""
    session = await get_owned_session(session_id, db, current_user)
    return session_service.to_out_dict(session)


@router.patch("/{session_id}", response_model=SessionOut,
              summary="Rename a chat session")
async def update_session(
    session_id: str,
    title: str = Query(..., description="The new title for the chat session"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Renames a session only if it belongs to the authenticated user."""
    await get_owned_session(session_id, db, current_user)
    session = await session_service.update_session(db, session_id, title)
    return session_service.to_out_dict(session)


@router.delete("/{session_id}", status_code=204,
               summary="Delete a chat session and all its message history")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a session only if it belongs to the authenticated user."""
    await get_owned_session(session_id, db, current_user)
    await session_service.delete_session(db, session_id)


@router.post("/{session_id}/messages", response_model=MessageOut, status_code=201,
             summary="Manually append a user or assistant message to history")
async def add_message(
    session_id: str,
    body: MessageIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Appends a message only if the session belongs to the authenticated user."""
    await get_owned_session(session_id, db, current_user)
    return await session_service.add_message(db, session_id, body)


@router.get("/{session_id}/messages", response_model=List[MessageOut],
            summary="Get message history for a session")
async def get_messages(
    session_id: str,
    limit: int = Query(50, description="Max number of recent messages to return"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns messages only if the session belongs to the authenticated user."""
    session = await get_owned_session(session_id, db, current_user)
    messages = session.messages or []
    return messages[-limit:]


@router.delete("/{session_id}/messages", status_code=204,
               summary="Clear chat history but keep the session metadata")
async def clear_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clears messages only if the session belongs to the authenticated user."""
    await get_owned_session(session_id, db, current_user)
    await session_service.clear_messages(db, session_id)


@router.post("/{session_id}/generate-title", response_model=TitleGenerateResponse,
             summary="Generate and save a chat session title")
async def generate_session_title(
    session_id: str,
    body: TitleGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a title based on the user's first query and save it to the session.
    Verifies that the session belongs to the authenticated user.
    """
    await get_owned_session(session_id, db, current_user)
    title = await title_service.generate_and_save_title(
        db=db,
        session_id=session_id,
        user_query=body.user_query
    )
    return TitleGenerateResponse(title=title)
