from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SummaryPoint(BaseModel):
    id: str
    text: str
    pages: List[int]
    primary_page: int
    keywords: Optional[List[str]] = None


class ChapterSummary(BaseModel):
    chapter_id: str
    summary_points: List[SummaryPoint]
    total_points: int
    generated_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True