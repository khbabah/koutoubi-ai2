from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid
from datetime import datetime


class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    flashcard_id = Column(String, ForeignKey("flashcards.id"), nullable=True)
    quiz_question_id = Column(String, ForeignKey("quiz_questions.id"), nullable=True)
    chapter_id = Column(String, ForeignKey("chapters.id"))
    
    # For flashcards
    last_seen = Column(DateTime)
    next_review = Column(DateTime)
    times_seen = Column(Integer, default=0)
    times_forgot = Column(Integer, default=0)
    times_remembered = Column(Integer, default=0)
    is_disabled = Column(Boolean, default=False)
    current_interval = Column(Integer, default=1)  # Days until next review
    
    # For quiz
    is_correct = Column(Boolean)
    time_spent = Column(Integer)  # seconds
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    user = relationship("User", back_populates="progress")
    flashcard = relationship("Flashcard", back_populates="progress")
    quiz_question = relationship("QuizQuestion", back_populates="progress")
    chapter = relationship("Chapter", back_populates="progress")