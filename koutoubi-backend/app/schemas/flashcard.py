from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FlashcardBase(BaseModel):
    type: str
    question: str
    answer: str
    example: Optional[str] = None
    source: str
    difficulty: str


class Flashcard(FlashcardBase):
    id: str
    chapter_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class FlashcardProgress(BaseModel):
    flashcard_id: str
    last_seen: Optional[datetime] = None
    next_review: Optional[datetime] = None
    times_seen: int = 0
    times_forgot: int = 0
    times_remembered: int = 0
    is_disabled: bool = False


class FlashcardFeedback(BaseModel):
    feedback: str  # "forgot", "remembered", "disabled"