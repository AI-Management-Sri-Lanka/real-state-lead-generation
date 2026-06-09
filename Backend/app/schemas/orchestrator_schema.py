from pydantic import BaseModel, Field
from typing import List, Optional

from app.schemas.lead_schema import ScrapedLead


class OrchestratorResponse(BaseModel):
    """Unified response envelope returned by the orchestrator."""

    message: str = Field(..., description="AI-generated response message to display to the user")
    leads: List[ScrapedLead] = Field(default_factory=list, description="Ranked lead results (empty for simple chat)")
    route: Optional[str] = Field(default=None, description="Routing decision: 'simple_chat' or 'lead_search'")

    class Config:
        from_attributes = True

