"""
Schemas for AI explain endpoints
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
import re


class ExplainRequest(BaseModel):
    action: str = Field(..., pattern="^(explain|quiz|question|reformulate)$")
    content: str = Field(..., min_length=1, max_length=10000)
    context: Optional[str] = Field(None, max_length=1000)
    question: Optional[str] = Field(None, max_length=1000)
    options: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    @validator('content', 'context', 'question')
    def validate_no_injection(cls, v):
        if v and any(pattern in v.lower() for pattern in ['<script', 'javascript:', 'onerror=', 'onclick=']):
            raise ValueError('Invalid content detected')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "action": "explain",
                "content": "Les fractions sont des nombres qui représentent une partie d'un tout",
                "context": "Chapitre 3: Les fractions",
                "options": {}
            }
        }


class ExplainResponse(BaseModel):
    success: bool
    result: Any  # Can be string, dict, or list depending on action
    action: str
    error: Optional[str] = None


class QuizQuestion(BaseModel):
    id: int
    question: str
    choices: List[str]
    correct_answer: int
    explanation: str


class QuizRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    num_questions: int = Field(5, ge=1, le=20)
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "Les fractions et leurs opérations",
                "num_questions": 5,
                "difficulty": "medium"
            }
        }


class QuizResponse(BaseModel):
    success: bool
    questions: List[QuizQuestion]
    total_questions: int


class Exercise(BaseModel):
    title: str
    statement: str
    hints: List[str]
    solution: str
    difficulty: str
    type: str


class ExerciseRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    exercise_type: str = Field("problem", pattern="^(problem|application|analysis)$")
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "Les équations du premier degré",
                "exercise_type": "problem",
                "difficulty": "medium"
            }
        }


class ExerciseResponse(BaseModel):
    success: bool
    exercise: Exercise