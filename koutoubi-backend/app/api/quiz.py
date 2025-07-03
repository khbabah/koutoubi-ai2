from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.quiz import QuizQuestion as QuizModel
from app.models.progress import UserProgress
from app.schemas.quiz import QuizQuestion, QuizAnswer, QuizResult

router = APIRouter()


@router.get("/chapter/{chapter_id}", response_model=List[QuizQuestion])
def get_chapter_quiz(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    questions = db.query(QuizModel).filter(
        QuizModel.chapter_id == chapter_id
    ).all()
    
    # Convert to response model
    response = []
    for q in questions:
        response.append(QuizQuestion(
            id=q.id,
            chapter_id=q.chapter_id,
            type=q.type,
            question=q.question,
            choices=q.choices_list,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
            key_info=q.key_info_list,
            source=q.source,
            created_at=q.created_at
        ))
    
    return response


@router.get("/{question_id}", response_model=QuizQuestion)
def get_quiz_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = db.query(QuizModel).filter(
        QuizModel.id == question_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return QuizQuestion(
        id=question.id,
        chapter_id=question.chapter_id,
        type=question.type,
        question=question.question,
        choices=question.choices_list,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        key_info=question.key_info_list,
        source=question.source,
        created_at=question.created_at
    )


@router.post("/submit", response_model=QuizResult)
def submit_quiz_answers(
    answers: List[QuizAnswer],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not answers:
        raise HTTPException(status_code=400, detail="No answers provided")
    
    # Get all questions
    question_ids = [a.question_id for a in answers]
    questions = db.query(QuizModel).filter(
        QuizModel.id.in_(question_ids)
    ).all()
    
    if len(questions) != len(answers):
        raise HTTPException(status_code=400, detail="Invalid question IDs")
    
    # Calculate score
    score = 0
    results = []
    total_time = 0
    chapter_id = questions[0].chapter_id
    
    for answer in answers:
        question = next(q for q in questions if q.id == answer.question_id)
        is_correct = answer.answer == question.correct_answer
        
        if is_correct:
            score += 1
        
        if answer.time_spent:
            total_time += answer.time_spent
        
        # Save progress
        progress = UserProgress(
            user_id=current_user.id,
            quiz_question_id=question.id,
            chapter_id=chapter_id,
            is_correct=is_correct,
            time_spent=answer.time_spent,
            last_seen=datetime.utcnow()
        )
        db.add(progress)
        
        results.append({
            "question_id": question.id,
            "user_answer": answer.answer,
            "correct_answer": question.correct_answer,
            "is_correct": is_correct,
            "explanation": question.explanation if not is_correct else None
        })
    
    db.commit()
    
    return QuizResult(
        chapter_id=chapter_id,
        score=score,
        total_questions=len(questions),
        percentage=round((score / len(questions)) * 100, 2),
        time_spent=total_time,
        answers=results
    )


@router.get("/chapter/{chapter_id}/history")
def get_quiz_history(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's quiz history for a chapter"""
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.chapter_id == chapter_id,
        UserProgress.quiz_question_id.isnot(None)
    ).all()
    
    if not progress:
        return {
            "attempts": 0,
            "average_score": 0,
            "best_score": 0,
            "last_attempt": None
        }
    
    # Group by attempt (by date)
    attempts = {}
    for p in progress:
        date = p.created_at.date()
        if date not in attempts:
            attempts[date] = {"correct": 0, "total": 0}
        
        attempts[date]["total"] += 1
        if p.is_correct:
            attempts[date]["correct"] += 1
    
    scores = [(a["correct"] / a["total"]) * 100 for a in attempts.values()]
    
    return {
        "attempts": len(attempts),
        "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
        "best_score": round(max(scores), 2) if scores else 0,
        "last_attempt": max(attempts.keys()) if attempts else None
    }