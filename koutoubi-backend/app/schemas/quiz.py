from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class QuizQuestionBase(BaseModel):
    type: str
    question: str
    choices: List[str]
    correct_answer: int
    explanation: Optional[str] = None
    key_info: Optional[List[str]] = None
    source: str


class QuizQuestion(QuizQuestionBase):
    id: str
    chapter_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuizAnswer(BaseModel):
    question_id: str
    answer: int
    time_spent: Optional[int] = None  # seconds


class QuizResult(BaseModel):
    chapter_id: str
    score: int
    total_questions: int
    percentage: float
    time_spent: Optional[int] = None
    answers: List[dict]