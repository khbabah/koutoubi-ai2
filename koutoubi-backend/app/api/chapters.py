from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.chapter import Chapter as ChapterModel
from app.schemas.chapter import Chapter, ChapterList

router = APIRouter()


@router.get("/", response_model=ChapterList)
def get_chapters(
    niveau: str = None,
    matiere: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ChapterModel)
    
    if niveau:
        query = query.filter(ChapterModel.niveau == niveau)
    if matiere:
        query = query.filter(ChapterModel.matiere == matiere)
    
    chapters = query.all()
    
    return {
        "chapters": chapters,
        "total": len(chapters)
    }


@router.get("/{chapter_id}", response_model=Chapter)
def get_chapter(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chapter = db.query(ChapterModel).filter(ChapterModel.id == chapter_id).first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    return chapter


@router.get("/{chapter_id}/stats")
def get_chapter_stats(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chapter = db.query(ChapterModel).filter(ChapterModel.id == chapter_id).first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Get flashcard count
    flashcard_count = len(chapter.flashcards)
    
    # Get quiz question count
    quiz_count = len(chapter.quiz_questions)
    
    # Get user progress
    user_progress = [p for p in chapter.progress if p.user_id == current_user.id]
    
    flashcards_studied = len([p for p in user_progress if p.flashcard_id])
    quiz_taken = len([p for p in user_progress if p.quiz_question_id])
    
    return {
        "chapter_id": chapter.id,
        "total_flashcards": flashcard_count,
        "total_quiz_questions": quiz_count,
        "flashcards_studied": flashcards_studied,
        "quiz_taken": quiz_taken,
        "completion_percentage": (flashcards_studied / flashcard_count * 100) if flashcard_count > 0 else 0
    }