from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.constants import DEFAULT_USER_ROLE
from datetime import datetime
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    avatar_url = Column(String)  # URL ou données base64 de l'avatar
    is_active = Column(Boolean, default=True)
    role = Column(String, default=DEFAULT_USER_ROLE)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relations
    progress = relationship("UserProgress", back_populates="user")
    summaries = relationship("ChapterSummary", back_populates="user")
    mindmaps = relationship("Mindmap", back_populates="user")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("UserSubscription", back_populates="user", uselist=False)