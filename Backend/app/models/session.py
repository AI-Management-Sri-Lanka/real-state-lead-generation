from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid


from app.db.base_class import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    @property
    def session_id(self):
        return self.id

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # link to auth user
    title = Column(String, nullable=False, default="New Chat")

    # Chat history (stored as individual Message rows in messages table)
    messages = relationship(
        "Message",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Message.timestamp"
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship(
        "User",
        back_populates="sessions",
    )
