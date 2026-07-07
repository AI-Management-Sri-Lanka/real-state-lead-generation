from pydantic import BaseModel, Field, EmailStr, model_validator
from datetime import datetime
from typing import Optional


class BuyerLeadCreate(BaseModel):

    # personal Information
    name: str = Field(..., min_length=1, max_length=255)
    mobile: str = Field(..., min_length=5, max_length=20)
    email: EmailStr

    # pre-qualification information
    household_income: str = Field(...)
    owns_property: bool = Field(...)
    available_equity_over_300k: Optional[bool] = Field(None)
    deposit_amount: Optional[str] = Field(None)
    age_group: str = Field(...)
    superannuation_over_230k: bool = Field(...)
    australian_state: str = Field(...)
    preferred_contact_day: str = Field(...)
    preferred_contact_time: str = Field(...)

    @model_validator(mode="after")
    def validate_conditional_fields(self):
        if self.owns_property and self.available_equity_over_300k is None:
            raise ValueError(
                "available_equity_over_300k is required when owns_property is Yes"
            )
        if not self.owns_property and self.deposit_amount is None:
            raise ValueError(
                "deposit_amount is required when owns_property is No"
            )
        return self

    model_config = {
        "extra": "forbid",
        "json_schema_extra": {
            "examples": [
                {
                    "name": "John Doe",
                    "mobile": "+61412345678",
                    "email": "john@example.com",
                    "household_income": "$120,000 - $150,000",
                    "owns_property": True,
                    "available_equity_over_300k": True,
                    "deposit_amount": None,
                    "age_group": "30 - 44 years",
                    "superannuation_over_230k": False,
                    "australian_state": "New South Wales",
                    "preferred_contact_day": "Monday",
                    "preferred_contact_time": "09:00 AM - 12:00 PM",
                }
            ]
        },
    }


class BuyerLeadResponse(BaseModel):
    id: int
    name: str
    mobile: str
    email: str
    household_income: str
    owns_property: bool
    available_equity_over_300k: Optional[bool] = None
    deposit_amount: Optional[str] = None
    age_group: str
    superannuation_over_230k: bool
    australian_state: str
    preferred_contact_day: str
    preferred_contact_time: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "name": "John Doe",
                    "mobile": "+61412345678",
                    "email": "john@example.com",
                    "household_income": "$120,000 - $150,000",
                    "owns_property": True,
                    "available_equity_over_300k": True,
                    "deposit_amount": None,
                    "age_group": "30 - 44 years",
                    "superannuation_over_230k": False,
                    "australian_state": "New South Wales",
                    "preferred_contact_day": "Monday",
                    "preferred_contact_time": "09:00 AM - 12:00 PM",
                    "created_at": "2024-05-24T12:00:00Z",
                    "updated_at": "2024-05-24T12:00:00Z",
                }
            ]
        },
    }


class BuyerLeadListResponse(BaseModel):
    items: list[BuyerLeadResponse]
    total: int
    skip: int
    limit: int