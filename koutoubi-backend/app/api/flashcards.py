from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.flashcard import Flashcard as FlashcardModel
from app.models.progress import UserProgress
from app.schemas.flashcard import Flashcard, FlashcardProgress, FlashcardFeedback

router = APIRouter()


def calculate_next_review(feedback: str, times_remembered: int, times_forgot: int, current_interval: int = 1):
    """Calculate next review date based on SuperMemo-2 inspired spaced repetition algorithm"""
    
    if feedback == "disabled":
        return None
    
    # Base intervals following SuperMemo-2 algorithm
    if feedback == "forgot":
        # Reset to 1 day when forgotten
        new_interval = 1
    elif feedback == "remembered":
        # Calculate new interval based on previous success
        if current_interval == 1:
            new_interval = 6  # First success: review in 6 days
        else:
            # Multiply interval by 2.5 for each successful review
            new_interval = int(current_interval * 2.5)
            
            # Adjust based on overall performance
            total_reviews = times_remembered + times_forgot
            if total_reviews > 0:
                success_rate = times_remembered / total_reviews
                if success_rate < 0.6:
                    # Struggling: reduce interval
                    new_interval = int(new_interval * 0.8)
                elif success_rate > 0.9:
                    # Excellent performance: increase interval
                    new_interval = int(new_interval * 1.2)
            
            # Cap at 365 days
            new_interval = min(new_interval, 365)
    
    return datetime.utcnow() + timedelta(days=new_interval)


@router.get("/chapter/{chapter_id}", response_model=List[Flashcard])
def get_chapter_flashcards(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    flashcards = db.query(FlashcardModel).filter(
        FlashcardModel.chapter_id == chapter_id
    ).all()
    
    return flashcards


@router.get("/{flashcard_id}", response_model=Flashcard)
def get_flashcard(
    flashcard_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    flashcard = db.query(FlashcardModel).filter(
        FlashcardModel.id == flashcard_id
    ).first()
    
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    return flashcard


@router.get("/{flashcard_id}/progress", response_model=FlashcardProgress)
def get_flashcard_progress(
    flashcard_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.flashcard_id == flashcard_id
    ).first()
    
    if not progress:
        return FlashcardProgress(
            flashcard_id=flashcard_id,
            times_seen=0,
            times_forgot=0,
            times_remembered=0,
            is_disabled=False
        )
    
    return FlashcardProgress(
        flashcard_id=flashcard_id,
        last_seen=progress.last_seen,
        next_review=progress.next_review,
        times_seen=progress.times_seen,
        times_forgot=progress.times_forgot,
        times_remembered=progress.times_remembered,
        is_disabled=progress.is_disabled
    )


@router.post("/{flashcard_id}/feedback")
def submit_flashcard_feedback(
    flashcard_id: str,
    feedback: FlashcardFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get or create progress
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.flashcard_id == flashcard_id
    ).first()
    
    flashcard = db.query(FlashcardModel).filter(
        FlashcardModel.id == flashcard_id
    ).first()
    
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            flashcard_id=flashcard_id,
            chapter_id=flashcard.chapter_id,
            times_seen=0,
            times_forgot=0,
            times_remembered=0,
            is_disabled=False
        )
        db.add(progress)
    
    # Update progress
    progress.last_seen = datetime.utcnow()
    progress.times_seen = (progress.times_seen or 0) + 1
    
    if feedback.feedback == "forgot":
        progress.times_forgot = (progress.times_forgot or 0) + 1
    elif feedback.feedback == "remembered":
        progress.times_remembered = (progress.times_remembered or 0) + 1
    elif feedback.feedback == "disabled":
        progress.is_disabled = True
    
    # Calculate next review with current interval
    current_interval = progress.current_interval or 1
    progress.next_review = calculate_next_review(
        feedback.feedback,
        progress.times_remembered,
        progress.times_forgot,
        current_interval
    )
    
    # Update interval based on feedback
    if feedback.feedback == "forgot":
        progress.current_interval = 1
    elif feedback.feedback == "remembered" and progress.next_review:
        # Calculate new interval in days
        days_until_next = (progress.next_review - datetime.utcnow()).days
        progress.current_interval = max(1, days_until_next)
    
    db.commit()
    
    return {
        "status": "success",
        "next_review": progress.next_review,
        "times_seen": progress.times_seen
    }


@router.get("/chapter/{chapter_id}/due", response_model=List[Flashcard])
def get_due_flashcards(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get flashcards that are due for review"""
    # Get all flashcards for the chapter
    flashcards = db.query(FlashcardModel).filter(
        FlashcardModel.chapter_id == chapter_id
    ).all()
    
    due_flashcards = []
    now = datetime.utcnow()
    
    for flashcard in flashcards:
        # Check user progress
        progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.flashcard_id == flashcard.id
        ).first()
        
        # Include if: never seen, due for review, or not disabled
        if not progress:
            due_flashcards.append(flashcard)
        elif not progress.is_disabled:
            if not progress.next_review or progress.next_review <= now:
                due_flashcards.append(flashcard)
    
    return due_flashcards


@router.get("/due/count")
def get_due_flashcards_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of flashcards due for review across all chapters"""
    # Get all user's flashcard progress
    all_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.flashcard_id.isnot(None),
        UserProgress.is_disabled == False
    ).all()
    
    # Get flashcards without any progress (never seen)
    seen_flashcard_ids = [p.flashcard_id for p in all_progress]
    unseen_count = db.query(FlashcardModel).filter(
        ~FlashcardModel.id.in_(seen_flashcard_ids) if seen_flashcard_ids else True
    ).count()
    
    # Count flashcards due for review
    now = datetime.utcnow()
    due_count = sum(1 for p in all_progress 
                   if not p.next_review or p.next_review <= now)
    
    total_due = unseen_count + due_count
    
    # Get breakdown by chapter
    chapter_counts = {}
    
    # Count by chapter for progress records
    for p in all_progress:
        if not p.next_review or p.next_review <= now:
            chapter_counts[p.chapter_id] = chapter_counts.get(p.chapter_id, 0) + 1
    
    # Add unseen flashcards by chapter
    if unseen_count > 0:
        unseen_flashcards = db.query(FlashcardModel).filter(
            ~FlashcardModel.id.in_(seen_flashcard_ids) if seen_flashcard_ids else True
        ).all()
        for fc in unseen_flashcards:
            chapter_counts[fc.chapter_id] = chapter_counts.get(fc.chapter_id, 0) + 1
    
    return {
        "total_due": total_due,
        "by_chapter": chapter_counts,
        "next_review_in_hours": min(
            [(p.next_review - now).total_seconds() / 3600 
             for p in all_progress if p.next_review and p.next_review > now],
            default=0
        )
    }