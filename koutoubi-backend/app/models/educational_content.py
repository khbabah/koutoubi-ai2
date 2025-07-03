from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class CustomQuiz(Base):
    """Quiz personnalisés créés par les enseignants/parents"""
    __tablename__ = "custom_quizzes"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text)
    chapter_id = Column(String, ForeignKey("chapters.id"))
    course_id = Column(String)  # Reference to course in content system
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    difficulty = Column(String, default="medium")  # easy, medium, hard
    time_limit = Column(Integer)  # en minutes
    pass_score = Column(Float, default=0.7)  # pourcentage pour réussir
    is_public = Column(Boolean, default=False)  # partagé avec d'autres enseignants
    tags = Column(JSON)  # pour la recherche et le filtrage
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    creator = relationship("User", backref="created_quizzes")
    questions = relationship("CustomQuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz")
    shared_with = relationship("QuizShare", back_populates="quiz")
    

class CustomQuizQuestion(Base):
    """Questions personnalisées pour les quiz"""
    __tablename__ = "custom_quiz_questions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    quiz_id = Column(String, ForeignKey("custom_quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default="multiple_choice")  # multiple_choice, true_false, short_answer
    choices = Column(JSON)  # pour les QCM
    correct_answer = Column(Text, nullable=False)  # index pour QCM, texte pour autres
    explanation = Column(Text)
    points = Column(Integer, default=1)
    order = Column(Integer)
    media_url = Column(String)  # pour les images/vidéos
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    quiz = relationship("CustomQuiz", back_populates="questions")


class CustomFlashcardDeck(Base):
    """Collections de flashcards créées par les enseignants/parents"""
    __tablename__ = "custom_flashcard_decks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text)
    chapter_id = Column(String, ForeignKey("chapters.id"))
    course_id = Column(String)  # Reference to course in content system
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=False)
    tags = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    creator = relationship("User", backref="created_flashcard_decks")
    cards = relationship("CustomFlashcard", back_populates="deck", cascade="all, delete-orphan")
    shared_with = relationship("FlashcardDeckShare", back_populates="deck")


class CustomFlashcard(Base):
    """Flashcards personnalisées"""
    __tablename__ = "custom_flashcards"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    deck_id = Column(String, ForeignKey("custom_flashcard_decks.id"), nullable=False)
    front_text = Column(Text, nullable=False)
    back_text = Column(Text, nullable=False)
    front_media_url = Column(String)
    back_media_url = Column(String)
    difficulty = Column(Integer, default=1)  # 1-5
    tags = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    deck = relationship("CustomFlashcardDeck", back_populates="cards")
    progress = relationship("FlashcardProgress", back_populates="flashcard")


class StudyGroup(Base):
    """Classes/groupes d'étude gérés par les enseignants"""
    __tablename__ = "study_groups"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text)
    code = Column(String, unique=True)  # code d'invitation
    teacher_id = Column(String, ForeignKey("users.id"), nullable=False)
    school_name = Column(String)
    grade_level = Column(String)
    subject = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    teacher = relationship("User", backref="managed_groups")
    members = relationship("GroupMember", back_populates="group")
    assignments = relationship("GroupAssignment", back_populates="group")


class GroupMember(Base):
    """Membres d'un groupe d'étude"""
    __tablename__ = "study_group_members"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    group_id = Column(String, ForeignKey("study_groups.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="student")  # student, assistant
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    group = relationship("StudyGroup", back_populates="members")
    user = relationship("User", backref="group_memberships")


class GroupAssignment(Base):
    """Devoirs assignés à un groupe"""
    __tablename__ = "group_assignments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    group_id = Column(String, ForeignKey("study_groups.id"), nullable=False)
    quiz_id = Column(String, ForeignKey("custom_quizzes.id"))
    flashcard_deck_id = Column(String, ForeignKey("custom_flashcard_decks.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    due_date = Column(DateTime)
    points = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    group = relationship("StudyGroup", back_populates="assignments")
    quiz = relationship("CustomQuiz")
    flashcard_deck = relationship("CustomFlashcardDeck")
    submissions = relationship("AssignmentSubmission", back_populates="assignment")


class AssignmentSubmission(Base):
    """Soumissions des devoirs par les étudiants"""
    __tablename__ = "assignment_submissions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    assignment_id = Column(String, ForeignKey("group_assignments.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    quiz_attempt_id = Column(String, ForeignKey("quiz_attempts.id"))
    flashcard_progress_id = Column(String)
    score = Column(Float)
    feedback = Column(Text)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    graded_at = Column(DateTime)
    
    # Relations
    assignment = relationship("GroupAssignment", back_populates="submissions")
    student = relationship("User", backref="assignment_submissions")
    quiz_attempt = relationship("QuizAttempt")


class QuizAttempt(Base):
    """Tentatives de quiz par les étudiants"""
    __tablename__ = "quiz_attempts"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    quiz_id = Column(String, ForeignKey("custom_quizzes.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    score = Column(Float)
    time_spent = Column(Integer)  # en secondes
    answers = Column(JSON)  # réponses détaillées
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relations
    quiz = relationship("CustomQuiz", back_populates="attempts")
    student = relationship("User", backref="quiz_attempts")


class FlashcardProgress(Base):
    """Progression sur les flashcards"""
    __tablename__ = "flashcard_progress"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    flashcard_id = Column(String, ForeignKey("custom_flashcards.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    ease_factor = Column(Float, default=2.5)  # algorithme de répétition espacée
    interval = Column(Integer, default=1)  # jours jusqu'à la prochaine révision
    repetitions = Column(Integer, default=0)
    last_reviewed = Column(DateTime)
    next_review = Column(DateTime)
    
    # Relations
    flashcard = relationship("CustomFlashcard", back_populates="progress")
    student = relationship("User", backref="flashcard_progress")


class QuizShare(Base):
    """Partage de quiz entre enseignants"""
    __tablename__ = "quiz_shares"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    quiz_id = Column(String, ForeignKey("custom_quizzes.id"), nullable=False)
    shared_with_id = Column(String, ForeignKey("users.id"), nullable=False)
    permission = Column(String, default="view")  # view, edit, duplicate
    shared_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    quiz = relationship("CustomQuiz", back_populates="shared_with")
    shared_with = relationship("User", backref="shared_quizzes")


class FlashcardDeckShare(Base):
    """Partage de decks de flashcards entre enseignants"""
    __tablename__ = "flashcard_deck_shares"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    deck_id = Column(String, ForeignKey("custom_flashcard_decks.id"), nullable=False)
    shared_with_id = Column(String, ForeignKey("users.id"), nullable=False)
    permission = Column(String, default="view")  # view, edit, duplicate
    shared_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    deck = relationship("CustomFlashcardDeck", back_populates="shared_with")
    shared_with = relationship("User", backref="shared_flashcard_decks")


class ParentChildLink(Base):
    """Lien entre parents et enfants"""
    __tablename__ = "parent_child_links"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    parent_id = Column(String, ForeignKey("users.id"), nullable=False)
    child_id = Column(String, ForeignKey("users.id"), nullable=False)
    verified = Column(Boolean, default=False)  # nécessite confirmation
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    parent = relationship("User", foreign_keys=[parent_id], backref="children_links")
    child = relationship("User", foreign_keys=[child_id], backref="parent_links")