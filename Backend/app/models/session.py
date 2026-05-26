from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid

from app.db.base_class import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    @property
    def session_id(self):
        return self.id
        
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # optional: link to auth user

    # Social platform info
    platform = Column(String, nullable=False)           # facebook | instagram | tiktok
    platform_user_id = Column(String, nullable=False)
    lead_name = Column(String, nullable=True)

    # Buyer profile (stored as JSON)
    lead_profile = Column(JSON, default={})             # budget, location, property_type, etc.

    # Chat history (stored as JSON list)
    messages = Column(JSON, default=[])

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24))