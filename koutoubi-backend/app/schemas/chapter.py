from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ChapterBase(BaseModel):
    numero: int
    title: str
    pdf_path: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    niveau: Optional[str] = None
    matiere: Optional[str] = None
    course_id: Optional[str] = None
    order: Optional[int] = None
    prerequisites: Optional[List[str]] = []
    description: Optional[str] = None


class Chapter(ChapterBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChapterList(BaseModel):
    chapters: list[Chapter]
    total: int