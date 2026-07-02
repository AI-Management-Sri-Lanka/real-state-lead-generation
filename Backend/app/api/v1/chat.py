from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from app.db.session import get_db
from app.schemas.chat_schema import ChatResponse, ChatRequest
from app.schemas.session_schema import MessageIn
from app.services import session_service
from app.services import title_service
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

    is_first = await title_service.is_first_message(
        db=db,
        session_id=request.session_id,
    )

    await session_service.add_message(
        db=db,
        session_id=request.session_id,
        msg=MessageIn(role="user", content=request.query)
    )

    tasks = [
        orchestrator.handle_user_query(
            user_query=request.query,
            session_id=request.session_id,
            db=db
        )
    ]

    if is_first and request.session_id:
        tasks.append(
            title_service.generate_and_save_title(
                db=db,
                session_id=request.session_id,
                user_query=request.query,
            )
        )

    results = await asyncio.gather(*tasks)
    res = results[0]

    generated_title: str | None = None
    if is_first and request.session_id:
        generated_title = results[1]
        logger.info("Auto-generated session title: %s | session_id=%s", generated_title, request.session_id)

    await session_service.add_message(
        db=db,
        session_id=request.session_id,
        msg=MessageIn(role="assistant", content=res.message)
    )

    return ChatResponse(
        success=True,
        message="Response generated successfully",
        data=res,
        generated_title=generated_title,
    )
