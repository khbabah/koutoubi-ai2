"""
Admin endpoints for content management (quizzes, flashcards, summaries)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.permissions import ensure_admin_role
from app.models.quiz import QuizQuestion as QuizQuestionModel
from app.models.flashcard import Flashcard as FlashcardModel
from app.models.summary import ChapterSummary as SummaryModel
from app.models.mindmap import Mindmap as MindmapModel
from app.models.user import User as UserModel
from app.models.chapter import Chapter as ChapterModel
from app.api.auth import get_current_user

router = APIRouter()


@router.get("/content/stats")
def get_content_statistics(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get overall content statistics
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    # Get content counts
    quiz_count = db.query(QuizQuestionModel).count()
    flashcard_count = db.query(FlashcardModel).count()
    summary_count = db.query(SummaryModel).count()
    mindmap_count = db.query(MindmapModel).count()
    chapter_count = db.query(ChapterModel).count()
    
    # Get content created in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    recent_quizzes = db.query(QuizQuestionModel).filter(
        QuizQuestionModel.created_at >= thirty_days_ago
    ).count()
    
    recent_flashcards = db.query(FlashcardModel).filter(
        FlashcardModel.created_at >= thirty_days_ago
    ).count()
    
    recent_summaries = db.query(SummaryModel).filter(
        SummaryModel.generated_at >= thirty_days_ago
    ).count()
    
    # Get most active content creators - simplified since models don't have created_by
    top_creators = []
    
    return {
        "total_content": {
            "quizzes": quiz_count,
            "flashcards": flashcard_count,
            "summaries": summary_count,
            "mindmaps": mindmap_count,
            "chapters": chapter_count
        },
        "recent_content": {
            "quizzes": recent_quizzes,
            "flashcards": recent_flashcards,
            "summaries": recent_summaries
        },
        "top_creators": [
            {
                "id": creator.id,
                "username": creator.username,
                "email": creator.email,
                "content_count": creator.content_count
            }
            for creator in top_creators
        ]
    }


@router.get("/content/quizzes")
def list_all_quizzes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    chapter_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    List all quizzes across the platform
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    query = db.query(QuizQuestionModel).options(
        joinedload(QuizQuestionModel.chapter)
    )
    
    # Apply filters
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                QuizQuestionModel.question.ilike(search_filter)
            )
        )
    
    if chapter_id:
        query = query.filter(QuizQuestionModel.chapter_id == chapter_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    quizzes = query.order_by(desc(QuizQuestionModel.created_at)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "quizzes": quizzes
    }


@router.get("/content/flashcards")
def list_all_flashcards(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    chapter_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    List all flashcards across the platform
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    query = db.query(FlashcardModel).options(
        joinedload(FlashcardModel.chapter)
    )
    
    # Apply filters
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                FlashcardModel.question.ilike(search_filter),
                FlashcardModel.answer.ilike(search_filter)
            )
        )
    
    if chapter_id:
        query = query.filter(FlashcardModel.chapter_id == chapter_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    flashcards = query.order_by(desc(FlashcardModel.created_at)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "flashcards": flashcards
    }


@router.get("/content/summaries")
def list_all_summaries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    chapter_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    List all summaries across the platform
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    query = db.query(SummaryModel).options(
        joinedload(SummaryModel.user),
        joinedload(SummaryModel.chapter)
    )
    
    # Apply filters
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                SummaryModel.content.ilike(search_filter),
                SummaryModel.key_points.ilike(search_filter)
            )
        )
    
    if chapter_id:
        query = query.filter(SummaryModel.chapter_id == chapter_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    summaries = query.order_by(desc(SummaryModel.generated_at)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "summaries": summaries
    }


@router.delete("/content/quiz/{quiz_id}")
def delete_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Delete a quiz
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    quiz = db.query(QuizQuestionModel).filter(QuizQuestionModel.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    db.delete(quiz)
    db.commit()
    
    return {"message": "Quiz deleted successfully"}


@router.delete("/content/flashcard/{flashcard_id}")
def delete_flashcard(
    flashcard_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Delete a flashcard
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    flashcard = db.query(FlashcardModel).filter(FlashcardModel.id == flashcard_id).first()
    if not flashcard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard not found"
        )
    
    db.delete(flashcard)
    db.commit()
    
    return {"message": "Flashcard deleted successfully"}


@router.delete("/content/summary/{summary_id}")
def delete_summary(
    summary_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Delete a summary
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    summary = db.query(SummaryModel).filter(SummaryModel.id == summary_id).first()
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary not found"
        )
    
    db.delete(summary)
    db.commit()
    
    return {"message": "Summary deleted successfully"}


@router.get("/content/chapters/{chapter_id}/details")
def get_chapter_content_details(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get detailed content information for a specific chapter
    Requires: Admin or Super Admin role
    """
    ensure_admin_role(current_user)
    
    chapter = db.query(ChapterModel).filter(ChapterModel.id == chapter_id).first()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found"
        )
    
    # Get content counts for this chapter
    quiz_count = db.query(QuizQuestionModel).filter(QuizQuestionModel.chapter_id == chapter_id).count()
    flashcard_count = db.query(FlashcardModel).filter(FlashcardModel.chapter_id == chapter_id).count()
    summary_count = db.query(SummaryModel).filter(SummaryModel.chapter_id == chapter_id).count()
    mindmap_count = db.query(MindmapModel).filter(MindmapModel.chapter_id == chapter_id).count()
    
    # Get recent content
    recent_content = []
    
    # Recent quizzes
    recent_quizzes = db.query(QuizQuestionModel).filter(
        QuizQuestionModel.chapter_id == chapter_id
    ).order_by(desc(QuizQuestionModel.created_at)).limit(5).all()
    
    for quiz in recent_quizzes:
        recent_content.append({
            "type": "quiz",
            "id": quiz.id,
            "title": quiz.title,
            "created_at": quiz.created_at,
            "created_by": quiz.created_by.username if quiz.created_by else "System"
        })
    
    # Sort recent content by date
    recent_content.sort(key=lambda x: x['created_at'], reverse=True)
    
    return {
        "chapter": {
            "id": chapter.id,
            "title": chapter.title,
            "description": chapter.description
        },
        "content_stats": {
            "quizzes": quiz_count,
            "flashcards": flashcard_count,
            "summaries": summary_count,
            "mindmaps": mindmap_count
        },
        "recent_content": recent_content[:10]
    }