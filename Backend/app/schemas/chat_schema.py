from typing import Any, Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    generated_title: Optional[str] = None  # populated on first message of a session