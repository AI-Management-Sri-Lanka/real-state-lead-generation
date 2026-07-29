from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

from app.db.base_class import Base
from app.schemas.lead_schema import Platform, PropertyType


class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = (
        UniqueConstraint("user_id", "post_link", name="uq_lead_user_post_link"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    external_user_id: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    post_link: Mapped[str] = mapped_column(String, nullable=False)
    post_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    platform: Mapped[Platform] = mapped_column(Enum(Platform), nullable=False)
    property_type: Mapped[PropertyType] = mapped_column(
        Enum(PropertyType), nullable=False, default=PropertyType.unknown
    )
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    match_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User")
