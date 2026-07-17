from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.chat_schema import ChatResponse, ChatRequest
from app.schemas.session_schema import MessageIn
from app.schemas.orchestrator_schema import OrchestratorResponse
from app.services import session_service
from app.services.ai.orchestrator import Orchestrator
from app.core.logger import get_logger

logger = get_logger(__name__)

from app.services.dependencies.deps import get_current_user

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    dependencies=[Depends(get_current_user)]
)


def _format_persisted_message(res: OrchestratorResponse) -> str:
    
    if not res.leads:
        return res.message

    lines = [res.message, "", f"**Found {len(res.leads)} potential leads:**", ""]
    for i, lead in enumerate(res.leads, start=1):
        lines.append(f"**{i}. @{lead.userId or lead.name}** ({lead.platform})")
        if lead.name and lead.name != lead.userId:
            lines.append(f"   Name: {lead.name}")
        if lead.property_type:
            lines.append(f"   Property Type: {lead.property_type}")
        if lead.location and lead.location != "null":
            lines.append(f"   Location: {lead.location}")
        if lead.date:
            lines.append(f"   Date: {lead.date.date()}")
        if lead.description:
            desc = lead.description if len(lead.description) <= 200 else lead.description[:200] + "..."
            lines.append(f'   Post: "{desc}"')
        if lead.post_link:
            lines.append(f"   Link: {lead.post_link}")
        lines.append("")

    return "\n".join(lines).rstrip()


from fastapi.responses import JSONResponse

@router.post("", response_model=ChatResponse)
async def post_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    orchestrator: Orchestrator = Depends(Orchestrator)
):
    if not request.query or not request.query.strip():
        return JSONResponse(
            status_code=400,
            content={
                "error": "Validation Error",
                "message": "Query cannot be empty."
            }
        )

    await session_service.add_message(
        db=db,
        session_id=request.session_id,
        msg=MessageIn(role="user", content=request.query)
    )

    res = await orchestrator.handle_user_query(
        user_query=request.query,
        session_id=request.session_id,
        db=db
    )

    await session_service.add_message(
        db=db,
        session_id=request.session_id,
        msg=MessageIn(role="assistant", content=_format_persisted_message(res))
    )

    return ChatResponse(
        success=True,
        message="Response generated successfully",
        data=res,
        generated_title=None,
    )
