from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid
from datetime import datetime


class Flashcard(Base):
    __tablename__ = "flashcards"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    chapter_id = Column(String, ForeignKey("chapters.id"))
    type = Column(String)  # "definition", "formula", "method", "concept"
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    example = Column(Text)
    source = Column(String)  # "pdf", "khan", "ai"
    difficulty = Column(String)  # "easy", "medium", "hard"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    chapter = relationship("Chapter", back_populates="flashcards")
    progress = relationship("UserProgress", back_populates="flashcard")