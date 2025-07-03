"""
AI Explain API endpoints
Handles all AI-powered explanations, questions, and content generation
"""
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.services.llm_service import llm_service, ActionType
from app.schemas.explain import (
    ExplainRequest,
    ExplainResponse,
    QuizRequest,
    QuizResponse,
    ExerciseRequest,
    ExerciseResponse
)

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


@router.post("/", response_model=ExplainResponse)
@limiter.limit("10/minute")
async def explain_content(
    request: Request,
    explain_request: ExplainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process AI explanation requests
    Action types: explain, quiz, question, reformulate
    """
    try:
        action_type = ActionType(explain_request.action)
        
        if action_type == ActionType.EXPLAIN:
            result = await llm_service.explain_content(
                explain_request.content,
                explain_request.context
            )
            return ExplainResponse(
                success=True,
                result=result,
                action=explain_request.action
            )
        
        elif action_type == ActionType.QUIZ:
            quiz_data = await llm_service.generate_quiz(
                explain_request.content,
                explain_request.options.get('num_questions', 5),
                explain_request.options.get('difficulty', 'medium')
            )
            return ExplainResponse(
                success=True,
                result=quiz_data,
                action=explain_request.action
            )
        
        elif action_type == ActionType.QUESTION:
            if not explain_request.question:
                raise HTTPException(
                    status_code=400,
                    detail="Question is required for question action"
                )
            
            answer = await llm_service.answer_question(
                explain_request.question,
                explain_request.content,
                explain_request.context
            )
            return ExplainResponse(
                success=True,
                result=answer,
                action=explain_request.action
            )
        
        elif action_type == ActionType.REFORMULATE:
            style = explain_request.options.get('style', 'simple')
            reformulated = await llm_service.reformulate_content(
                explain_request.content,
                style
            )
            return ExplainResponse(
                success=True,
                result=reformulated,
                action=explain_request.action
            )
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown action type: {explain_request.action}"
            )
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing explain request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error processing your request. Please try again."
        )


@router.post("/quiz", response_model=QuizResponse)
@limiter.limit("5/minute")
async def generate_quiz(
    request: Request,
    quiz_request: QuizRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate quiz questions based on content"""
    try:
        quiz_data = await llm_service.generate_quiz(
            quiz_request.content,
            quiz_request.num_questions,
            quiz_request.difficulty
        )
        
        return QuizResponse(
            success=True,
            questions=quiz_data.get('questions', []),
            total_questions=len(quiz_data.get('questions', []))
        )
        
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error generating quiz. Please try again."
        )


@router.post("/exercise", response_model=ExerciseResponse)
@limiter.limit("5/minute")
async def generate_exercise(
    request: Request,
    exercise_request: ExerciseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate exercise based on content"""
    try:
        exercise_data = await llm_service.generate_exercise(
            exercise_request.content,
            exercise_request.exercise_type,
            exercise_request.difficulty
        )
        
        return ExerciseResponse(
            success=True,
            exercise=exercise_data
        )
        
    except Exception as e:
        logger.error(f"Error generating exercise: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error generating exercise. Please try again."
        )


@router.post("/check-answer")
@limiter.limit("20/minute")
async def check_answer(
    request: Request,
    content: str = Body(..., embed=True, max_length=5000),
    user_answer: str = Body(..., embed=True, max_length=5000),
    expected_answer: Optional[str] = Body(None, embed=True, max_length=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check user's answer using AI"""
    try:
        # Create a prompt for checking the answer
        check_prompt = f"""
Question/Exercice: {content}

Réponse de l'élève: {user_answer}

{f"Réponse attendue: {expected_answer}" if expected_answer else ""}

Évalue cette réponse et fournis:
1. Si la réponse est correcte (oui/non)
2. Un score sur 10
3. Un feedback constructif
4. Les points à améliorer s'il y en a
"""
        
        evaluation = await llm_service.answer_question(
            check_prompt,
            "Évaluation de réponse d'élève",
            "Tu es un correcteur bienveillant mais rigoureux"
        )
        
        return {
            "success": True,
            "evaluation": evaluation
        }
        
    except Exception as e:
        logger.error(f"Error checking answer: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error checking answer. Please try again."
        )


@router.get("/health")
async def check_llm_health():
    """Check if LLM service is healthy"""
    try:
        is_healthy = await llm_service.check_ollama_health()
        return {
            "healthy": is_healthy,
            "model": llm_service.model,
            "service": "ollama"
        }
    except Exception as e:
        return {
            "healthy": False,
            "error": str(e)
        }