from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid
from datetime import datetime
import json


class ChapterSummary(Base):
    __tablename__ = "chapter_summaries"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    chapter_id = Column(String, ForeignKey("chapters.id"))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # NULL = global
    summary_points = Column(Text, nullable=False)  # JSON string
    generated_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    # Relations
    chapter = relationship("Chapter", back_populates="summaries")
    user = relationship("User", back_populates="summaries")
    
    # Helper for JSON
    @property
    def points(self):
        return json.loads(self.summary_points) if self.summary_points else []