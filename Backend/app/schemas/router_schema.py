from pydantic import BaseModel, Field
from typing import Optional


class RouterOutput(BaseModel):
    lead_search: bool = Field(..., description="True if the query is about finding real estate leads")
    simple_chat: bool = Field(..., description="True if the query is casual / non-lead-related")
    preferred_location: Optional[str] = Field(default=None, description="Location preference extracted from the query")
    budget_range: Optional[str] = Field(default=None, description="Budget range extracted from the query")
    property_type: Optional[str] = Field(default=None, description="Property type extracted from the query")
    investment_preferences: Optional[str] = Field(default=None, description="Any investment preference details")
