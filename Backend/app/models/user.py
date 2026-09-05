from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.sql import func
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .session import Session
    from .properties import Property

from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    # Nullable because accounts created via "Sign in with Google" have no
    # local password until (optionally) the user sets one later.
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # Unique Google "sub" claim identifying the Google account linked to this
    # user. Null for users who have never used Google sign-in.
    google_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    # "local" (email/password) or "google". A local account that later links
    # a Google account keeps auth_provider="local" but gains a google_id, so
    # it can sign in either way.
    auth_provider: Mapped[str] = mapped_column(String, default="local", server_default="local", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    sessions: Mapped[List["Session"]] = relationship(
        "Session",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    properties = relationship(
        "Property",
        back_populates="owner",
        cascade="all, delete-orphan",
    )