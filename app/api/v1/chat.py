from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, Any

from app.db.session import get_db
from app.services.ai.router import Router
from app.services.ai.simple_chat import DirectChatTool
from app.services.ai.rank_leads import RankLeads
from app.core.logger import get_logger

logger = get_logger(__name__)

from app.services.dependencies.deps import get_current_user

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    dependencies=[Depends(get_current_user)]
)


# Request/Response Models

class ChatRequest(BaseModel):
    query: str
    # sessions


class LeadResult(BaseModel):
    username: str
    platform: str
    post: str
    score: float


class ChatResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


# Routes 
@router.post("", response_model=ChatResponse)
async def post_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
) -> ChatResponse:
    """
    Handle user chat queries with intelligent routing.
    
    Flow:
    1. Route query (lead_search or simple_chat)
    2. Execute appropriate AI service
    3. Return response
    
    Note: Session management to be implemented later
    """
    try:
        logger.info(f"Processing chat query: {request.query[:50]}...")
        
        # Route the query
        ai_router = Router()
        routing_result = ai_router.chat(request.query)
        
        logger.debug(f"Routing result: {routing_result}")
        
        # Initialize response data
        response_data = {
            "query": request.query,
            "route": None,
            "response": None,
            "leads": None
        }
        
        # Process based on routing
        if routing_result.get("lead_search"):
            # Lead search route
            logger.info("Routing to lead_search")
            response_data["route"] = "lead_search"
            
            # Extract preferences from routing result
            preferences = {
                "preferred_location": routing_result.get("preferred_location"),
                "budget_range": routing_result.get("budget_range"),
                "property_type": routing_result.get("property_type"),
                "investment_preferences": routing_result.get("investment_preferences")
            }
            response_data["preferences"] = preferences
            
            # Rank leads (currently uses dummy data)
            rank_leads_service = RankLeads()
            ranked_leads = rank_leads_service.rank_leads(
                query=request.query,
                leads=[]
            )
            
            response_data["leads"] = [
                {
                    "username": lead["username"],
                    "platform": lead["platform"],
                    "post": lead["post"],
                    "score": lead["score"]
                }
                for lead in ranked_leads
            ]
            
            response_message = f"Found {len(ranked_leads)} relevant leads matching your criteria."
            
        elif routing_result.get("simple_chat"):
            # Simple chat route
            logger.info("Routing to simple_chat")
            response_data["route"] = "simple_chat"
            
            # Get chat response (without session history for now)
            chat_tool = DirectChatTool()
            ai_response = chat_tool.chat(
                user_query=request.query,
                session_history=""  # No history for now
            )
            
            response_data["response"] = ai_response
            response_message = "Response generated successfully."
        
        else:
            # Fallback to simple chat if routing is ambiguous
            logger.warning("Ambiguous routing, defaulting to simple_chat")
            response_data["route"] = "simple_chat"
            
            chat_tool = DirectChatTool()
            ai_response = chat_tool.chat(
                user_query=request.query,
                session_history=""
            )
            
            response_data["response"] = ai_response
            response_message = "Response generated successfully."
        
        logger.info("Chat processed successfully")
        
        return ChatResponse(
            success=True,
            message=response_message,
            data=response_data
        )
    
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat query: {str(e)}"
        )
