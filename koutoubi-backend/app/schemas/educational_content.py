from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    PARENT = "parent"
    ADMIN = "admin"


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# Quiz Schemas
class QuizQuestionBase(BaseModel):
    question_text: str
    question_type: QuestionType = QuestionType.MULTIPLE_CHOICE
    choices: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    points: int = 1
    media_url: Optional[str] = None


class QuizQuestionCreate(QuizQuestionBase):
    order: Optional[int] = None


class QuizQuestion(QuizQuestionBase):
    id: str
    quiz_id: str
    order: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    chapter_id: Optional[str] = None
    course_id: Optional[str] = None
    difficulty: Difficulty = Difficulty.MEDIUM
    time_limit: Optional[int] = None
    pass_score: float = 0.7
    is_public: bool = False
    tags: Optional[List[str]] = None


class QuizCreate(QuizBase):
    questions: List[QuizQuestionCreate]


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    time_limit: Optional[int] = None
    pass_score: Optional[float] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class Quiz(QuizBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    questions: List[QuizQuestion] = []
    creator_name: Optional[str] = None
    attempts_count: int = 0
    average_score: Optional[float] = None
    questions_count: Optional[int] = None
    
    class Config:
        from_attributes = True


# Flashcard Schemas
class FlashcardBase(BaseModel):
    front_text: str
    back_text: str
    front_media_url: Optional[str] = None
    back_media_url: Optional[str] = None
    difficulty: int = Field(ge=1, le=5, default=1)
    tags: Optional[List[str]] = None


class FlashcardCreate(FlashcardBase):
    pass


class Flashcard(FlashcardBase):
    id: str
    deck_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class FlashcardDeckBase(BaseModel):
    title: str
    description: Optional[str] = None
    chapter_id: Optional[str] = None
    course_id: Optional[str] = None
    is_public: bool = False
    tags: Optional[List[str]] = None


class FlashcardDeckCreate(FlashcardDeckBase):
    cards: List[FlashcardCreate] = []


class FlashcardDeckUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class FlashcardDeck(FlashcardDeckBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    cards: List[Flashcard] = []
    creator_name: Optional[str] = None
    cards_count: int = 0
    
    class Config:
        from_attributes = True


# Study Group Schemas
class StudyGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    school_name: Optional[str] = None
    grade_level: Optional[str] = None
    subject: Optional[str] = None


class StudyGroupCreate(StudyGroupBase):
    pass


class StudyGroup(StudyGroupBase):
    id: str
    code: str
    teacher_id: str
    teacher_name: str
    is_active: bool
    created_at: datetime
    members_count: int = 0
    
    class Config:
        from_attributes = True


class GroupMemberBase(BaseModel):
    user_id: str
    role: str = "student"


class GroupMember(GroupMemberBase):
    id: str
    group_id: str
    joined_at: datetime
    user_name: str
    user_email: str
    
    class Config:
        from_attributes = True


# Assignment Schemas
class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    quiz_id: Optional[str] = None
    flashcard_deck_id: Optional[str] = None
    due_date: Optional[datetime] = None
    points: Optional[int] = None


class AssignmentCreate(AssignmentBase):
    group_id: str


class Assignment(AssignmentBase):
    id: str
    group_id: str
    created_at: datetime
    submissions_count: int = 0
    average_score: Optional[float] = None
    
    class Config:
        from_attributes = True


# Progress Tracking Schemas
class QuizAttemptCreate(BaseModel):
    quiz_id: str
    answers: Dict[str, Any]


class QuizAttempt(BaseModel):
    id: str
    quiz_id: str
    student_id: str
    score: float
    time_spent: int
    answers: Dict[str, Any]
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class FlashcardProgressUpdate(BaseModel):
    quality: int = Field(ge=0, le=5)  # 0-5 rating from SM-2 algorithm


class StudentProgress(BaseModel):
    student_id: str
    student_name: str
    quizzes_completed: int
    average_quiz_score: float
    flashcards_reviewed: int
    flashcards_mastered: int
    last_activity: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Sharing Schemas
class ShareRequest(BaseModel):
    user_email: str
    permission: str = "view"  # view, edit, duplicate


class ShareInfo(BaseModel):
    id: str
    shared_with_name: str
    shared_with_email: str
    permission: str
    shared_at: datetime
    
    class Config:
        from_attributes = True


# Import/Export Schemas
class QuizImport(BaseModel):
    """Format pour importer des quiz depuis CSV/JSON"""
    title: str
    questions: List[Dict[str, Any]]


class FlashcardImport(BaseModel):
    """Format pour importer des flashcards depuis CSV/JSON"""
    title: str
    cards: List[Dict[str, str]]  # front, back, optionally tags