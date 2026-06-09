from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ── Messages ──────────────────────────────────────────────────────────────────
class MessageIn(BaseModel):
    role: str = Field(..., example="user")                  # user | assistant
    content: str


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Session ───────────────────────────────────────────────────────────────────
class SessionCreate(BaseModel):
    user_id: int
    title: Optional[str] = "New Chat"


class SessionOut(BaseModel):
    session_id: str
    user_id: Optional[int] = None
    title: str
    messages: List[MessageOut]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionSummary(BaseModel):
    session_id: str
    user_id: Optional[int] = None
    title: str
    message_count: int
    updated_at: datetime

    class Config:
        from_attributes = True
