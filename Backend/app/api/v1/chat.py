from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.chat_schema import ChatResponse, ChatRequest
from app.services.ai.orchestrator import Orchestrator
from app.core.logger import get_logger

logger = get_logger(__name__)

from app.services.dependencies.deps import get_current_user

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    dependencies=[Depends(get_current_user)]
)

@router.post("", response_model=ChatResponse)
async def post_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    orchestrator: Orchestrator = Depends(Orchestrator)
) -> ChatResponse:

    res = await orchestrator.handle_user_query(
        user_query=request.query,
        session_id=request.session_id,
        db=db
    )

    return ChatResponse(
        success=True,
        message="Response generated successfully",
        data=res
    )
