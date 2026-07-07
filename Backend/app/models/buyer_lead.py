from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime

from app.db.base_class import Base


class BuyerLead(Base):
    __tablename__ = "buyer_leads"

    # personal information
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    mobile: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # pre-qualification information
    household_income: Mapped[str] = mapped_column(String(50), nullable=False)
    owns_property: Mapped[bool] = mapped_column(Boolean, nullable=False)
    available_equity_over_300k: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    deposit_amount: Mapped[str | None] = mapped_column(String(100), nullable=True)
    age_group: Mapped[str] = mapped_column(String(30), nullable=False)
    superannuation_over_230k: Mapped[bool] = mapped_column(Boolean, nullable=False)
    australian_state: Mapped[str] = mapped_column(String(50), nullable=False)
    preferred_contact_day: Mapped[str] = mapped_column(String(15), nullable=False)
    preferred_contact_time: Mapped[str] = mapped_column(String(30), nullable=False)
    
    # timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
