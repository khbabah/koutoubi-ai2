from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid
from datetime import datetime


class Chapter(Base):
    __tablename__ = "chapters"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    numero = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    pdf_path = Column(String)
    page_start = Column(Integer)
    page_end = Column(Integer)
    niveau = Column(String)  # "2nde", "1ère", "Terminale"
    matiere = Column(String)  # "mathématiques", "physique", etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    flashcards = relationship("Flashcard", back_populates="chapter")
    quiz_questions = relationship("QuizQuestion", back_populates="chapter")
    summaries = relationship("ChapterSummary", back_populates="chapter")
    progress = relationship("UserProgress", back_populates="chapter")