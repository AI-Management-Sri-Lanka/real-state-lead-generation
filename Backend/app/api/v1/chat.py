from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.chat_schema import ChatResponse, ChatRequest
from app.schemas.session_schema import MessageIn
from app.services import session_service
from app.services.ai.orchestrator import Orchestrator
from app.core.logger import get_logger

logger = get_logger(__name__)

from app.services.dependencies.deps import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    dependencies=[Depends(get_current_user)]
)

@router.post("", response_model=ChatResponse)
async def post_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    orchestrator: Orchestrator = Depends(Orchestrator),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:

    await session_service.add_message(
        db=db,
        session_id=request.session_id,
        msg=MessageIn(role="user", content=request.query)
    )

    res = await orchestrator.handle_user_query(
        user_query=request.query,
        session_id=request.session_id,
        db=db,
        user_id=current_user.id,
    )

    await session_service.add_message(
        db=db,
        session_id=request.session_id,
        msg=MessageIn(role="assistant", content=res.message)
    )

    return ChatResponse(
        success=True,
        message="Response generated successfully",
        data=res
    )
