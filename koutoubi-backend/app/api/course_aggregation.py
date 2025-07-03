"""
Course-level aggregation endpoints for flashcards, quiz, and mindmaps
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.models.chapter import Chapter
from app.models.flashcard import Flashcard
from app.models.quiz import QuizQuestion
from app.models.mindmap import Mindmap
from app.schemas.flashcard import Flashcard as FlashcardSchema
from app.schemas.quiz import QuizQuestion as QuizQuestionSchema

router = APIRouter()


@router.get("/courses/{course_id}/flashcards", response_model=List[FlashcardSchema])
async def get_course_flashcards(
    course_id: str,
    limit: Optional[int] = Query(None, description="Limit number of flashcards"),
    random: bool = Query(False, description="Randomize flashcards"),
    difficulty: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all flashcards for a course (all chapters combined)"""
    # Get all chapters for this course
    chapters = db.query(Chapter).filter(Chapter.course_id == course_id).all()
    
    if not chapters:
        raise HTTPException(status_code=404, detail="Course not found")
    
    chapter_ids = [chapter.id for chapter in chapters]
    
    # Query flashcards from all chapters
    query = db.query(Flashcard).filter(Flashcard.chapter_id.in_(chapter_ids))
    
    if difficulty:
        query = query.filter(Flashcard.difficulty == difficulty)
    
    if random:
        query = query.order_by(func.random())
    
    if limit:
        query = query.limit(limit)
    
    flashcards = query.all()
    
    return flashcards


@router.get("/courses/{course_id}/quiz", response_model=List[QuizQuestionSchema])
async def get_course_quiz(
    course_id: str,
    limit: Optional[int] = Query(20, description="Number of questions"),
    random: bool = Query(True, description="Randomize questions"),
    difficulty: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get quiz questions for entire course (all chapters combined)"""
    # Get all chapters for this course
    chapters = db.query(Chapter).filter(Chapter.course_id == course_id).all()
    
    if not chapters:
        raise HTTPException(status_code=404, detail="Course not found")
    
    chapter_ids = [chapter.id for chapter in chapters]
    
    # Query quiz questions from all chapters
    query = db.query(QuizQuestion).filter(QuizQuestion.chapter_id.in_(chapter_ids))
    
    if difficulty:
        query = query.filter(QuizQuestion.difficulty == difficulty)
    
    if random:
        query = query.order_by(func.random())
    
    if limit:
        query = query.limit(limit)
    
    questions = query.all()
    
    return questions


@router.get("/courses/{course_id}/chapters")
async def get_course_chapters(
    course_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chapters for a course with their metadata"""
    chapters = db.query(Chapter).filter(
        Chapter.course_id == course_id
    ).order_by(Chapter.order).all()
    
    if not chapters:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Enrich with statistics
    result = []
    for chapter in chapters:
        flashcard_count = db.query(Flashcard).filter(
            Flashcard.chapter_id == chapter.id
        ).count()
        
        quiz_count = db.query(QuizQuestion).filter(
            QuizQuestion.chapter_id == chapter.id
        ).count()
        
        result.append({
            "id": chapter.id,
            "numero": chapter.numero,
            "title": chapter.title,
            "description": chapter.description,
            "order": chapter.order,
            "prerequisites": chapter.prerequisites,
            "flashcard_count": flashcard_count,
            "quiz_count": quiz_count,
            "page_start": chapter.page_start,
            "page_end": chapter.page_end
        })
    
    return {
        "course_id": course_id,
        "chapters": result,
        "total_chapters": len(chapters)
    }


@router.post("/courses/{course_id}/mindmap/generate")
async def generate_course_mindmap(
    course_id: str,
    regenerate: bool = Query(False, description="Force regeneration"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate or retrieve mindmap for entire course"""
    # Check if mindmap exists
    existing = db.query(Mindmap).filter(
        Mindmap.pdf_id == course_id,
        Mindmap.level == 'course',
        Mindmap.chapter_id == None
    ).first()
    
    if existing and not regenerate:
        return existing
    
    # TODO: Implement mindmap generation logic
    # This would analyze all chapters and create a comprehensive mindmap
    
    return {"message": "Mindmap generation for course not yet implemented"}


@router.post("/chapters/{chapter_id}/mindmap/generate")
async def generate_chapter_mindmap(
    chapter_id: str,
    regenerate: bool = Query(False, description="Force regeneration"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate or retrieve mindmap for specific chapter"""
    # Get chapter
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Check if mindmap exists
    existing = db.query(Mindmap).filter(
        Mindmap.chapter_id == chapter_id,
        Mindmap.level == 'chapter'
    ).first()
    
    if existing and not regenerate:
        return existing
    
    # TODO: Implement chapter-specific mindmap generation
    
    return {"message": "Mindmap generation for chapter not yet implemented"}


# Import moved to top of file