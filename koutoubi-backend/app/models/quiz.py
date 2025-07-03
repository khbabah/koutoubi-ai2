from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid
from datetime import datetime
import json


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    chapter_id = Column(String, ForeignKey("chapters.id"))
    type = Column(String)
    question = Column(Text, nullable=False)
    choices = Column(Text, nullable=False)  # JSON string
    correct_answer = Column(Integer, nullable=False)
    explanation = Column(Text)
    key_info = Column(Text)  # JSON string for keywords
    source = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    chapter = relationship("Chapter", back_populates="quiz_questions")
    progress = relationship("UserProgress", back_populates="quiz_question")
    
    # Helper methods for JSON
    @property
    def choices_list(self):
        return json.loads(self.choices) if self.choices else []
    
    @property
    def key_info_list(self):
        return json.loads(self.key_info) if self.key_info else []