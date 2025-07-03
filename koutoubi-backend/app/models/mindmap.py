from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta

from app.core.database import Base

class Mindmap(Base):
    __tablename__ = "mindmaps"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(func.gen_random_uuid()))
    pdf_id = Column(String, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    content = Column(Text, nullable=False)  # JSON content of the mindmap
    markdown = Column(Text)  # Markdown representation for markmap
    
    version = Column(Integer, default=1)
    is_ai_generated = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="mindmaps")
    
    def is_valid(self, hours=24):
        """Check if mindmap is still valid (not too old)"""
        if not self.created_at:
            return False
        return datetime.utcnow() - self.created_at < timedelta(hours=hours)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "pdf_id": self.pdf_id,
            "user_id": self.user_id,
            "content": self.content,
            "markdown": self.markdown,
            "version": self.version,
            "is_ai_generated": self.is_ai_generated,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }