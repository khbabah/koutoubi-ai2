from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import csv
import json
import io
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.models.educational_content import (
    CustomQuiz, CustomQuizQuestion, CustomFlashcardDeck, CustomFlashcard,
    StudyGroup, GroupMember, GroupAssignment, QuizAttempt, FlashcardProgress,
    QuizShare, FlashcardDeckShare
)
from app.schemas.educational_content import (
    QuizCreate, QuizUpdate, Quiz, QuizQuestion,
    FlashcardDeckCreate, FlashcardDeckUpdate, FlashcardDeck,
    StudyGroupCreate, StudyGroup as StudyGroupSchema,
    AssignmentCreate, Assignment,
    QuizAttemptCreate, QuizAttempt as QuizAttemptSchema,
    ShareRequest, UserRole
)
from app.core.permissions import require_role, is_teacher_or_parent


router = APIRouter()


# === QUIZ MANAGEMENT ===

@router.post("/quizzes", response_model=Quiz)
def create_quiz(
    quiz_data: QuizCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau quiz personnalisé (enseignants/parents uniquement)"""
    if not is_teacher_or_parent(current_user):
        raise HTTPException(
            status_code=403,
            detail="Seuls les enseignants et parents peuvent créer des quiz"
        )
    
    # Créer le quiz
    quiz = CustomQuiz(
        **quiz_data.dict(exclude={"questions"}),
        created_by=current_user.id
    )
    db.add(quiz)
    db.flush()
    
    # Ajouter les questions
    for idx, q_data in enumerate(quiz_data.questions):
        question = CustomQuizQuestion(
            quiz_id=quiz.id,
            order=q_data.order or idx,
            **q_data.dict(exclude={"order"})
        )
        db.add(question)
    
    db.commit()
    db.refresh(quiz)
    
    # Charger les relations
    quiz = db.query(CustomQuiz).options(
        joinedload(CustomQuiz.questions),
        joinedload(CustomQuiz.creator)
    ).filter(CustomQuiz.id == quiz.id).first()
    
    return quiz


@router.get("/quizzes", response_model=List[Quiz])
def get_quizzes(
    skip: int = 0,
    limit: int = 20,
    my_quizzes: bool = False,
    public_only: bool = False,
    chapter_id: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir la liste des quiz disponibles"""
    query = db.query(CustomQuiz).options(
        joinedload(CustomQuiz.creator),
        joinedload(CustomQuiz.questions)
    )
    
    if my_quizzes:
        query = query.filter(CustomQuiz.created_by == current_user.id)
    elif public_only and current_user.role == "student":
        # Les étudiants ne voient que les quiz publics ou ceux partagés avec eux
        query = query.filter(
            (CustomQuiz.is_public == True) |
            (CustomQuiz.created_by == current_user.id)
        )
    
    if chapter_id:
        query = query.filter(CustomQuiz.chapter_id == chapter_id)
    
    quizzes = query.offset(skip).limit(limit).all()
    
    # Ajouter les statistiques
    for quiz in quizzes:
        quiz.creator_name = quiz.creator.full_name or quiz.creator.username
        quiz.attempts_count = len(quiz.attempts)
        quiz.questions_count = len(quiz.questions)
        if quiz.attempts:
            quiz.average_score = sum(a.score for a in quiz.attempts if a.score) / len(quiz.attempts)
    
    return quizzes


@router.get("/quizzes/{quiz_id}", response_model=Quiz)
def get_quiz(
    quiz_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir un quiz spécifique"""
    quiz = db.query(CustomQuiz).options(
        joinedload(CustomQuiz.questions),
        joinedload(CustomQuiz.creator)
    ).filter(CustomQuiz.id == quiz_id).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz non trouvé")
    
    # Vérifier les permissions
    if (quiz.created_by != current_user.id and 
        not quiz.is_public and 
        current_user.role == "student"):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    quiz.creator_name = quiz.creator.full_name or quiz.creator.username
    quiz.questions_count = len(quiz.questions)
    return quiz


@router.put("/quizzes/{quiz_id}", response_model=Quiz)
def update_quiz(
    quiz_id: str,
    quiz_update: QuizUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un quiz"""
    quiz = db.query(CustomQuiz).filter(CustomQuiz.id == quiz_id).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz non trouvé")
    
    if quiz.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres quiz")
    
    for field, value in quiz_update.dict(exclude_unset=True).items():
        setattr(quiz, field, value)
    
    quiz.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quiz)
    
    return quiz


@router.delete("/quizzes/{quiz_id}")
def delete_quiz(
    quiz_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un quiz"""
    quiz = db.query(CustomQuiz).filter(CustomQuiz.id == quiz_id).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz non trouvé")
    
    if quiz.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres quiz")
    
    db.delete(quiz)
    db.commit()
    
    return {"message": "Quiz supprimé avec succès"}


# === FLASHCARD MANAGEMENT ===

@router.post("/flashcard-decks", response_model=FlashcardDeck)
def create_flashcard_deck(
    deck_data: FlashcardDeckCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau deck de flashcards"""
    if not is_teacher_or_parent(current_user):
        raise HTTPException(
            status_code=403,
            detail="Seuls les enseignants et parents peuvent créer des decks"
        )
    
    # Créer le deck
    deck = CustomFlashcardDeck(
        **deck_data.dict(exclude={"cards"}),
        created_by=current_user.id
    )
    db.add(deck)
    db.flush()
    
    # Ajouter les cartes
    for card_data in deck_data.cards:
        card = CustomFlashcard(
            deck_id=deck.id,
            **card_data.dict()
        )
        db.add(card)
    
    db.commit()
    db.refresh(deck)
    
    # Charger les relations
    deck = db.query(CustomFlashcardDeck).options(
        joinedload(CustomFlashcardDeck.cards),
        joinedload(CustomFlashcardDeck.creator)
    ).filter(CustomFlashcardDeck.id == deck.id).first()
    
    deck.creator_name = deck.creator.full_name or deck.creator.username
    deck.cards_count = len(deck.cards)
    
    return deck


@router.get("/flashcard-decks", response_model=List[FlashcardDeck])
def get_flashcard_decks(
    skip: int = 0,
    limit: int = 20,
    my_decks: bool = False,
    public_only: bool = False,
    chapter_id: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir la liste des decks de flashcards"""
    query = db.query(CustomFlashcardDeck).options(
        joinedload(CustomFlashcardDeck.creator)
    )
    
    if my_decks:
        query = query.filter(CustomFlashcardDeck.created_by == current_user.id)
    elif public_only and current_user.role == "student":
        query = query.filter(
            (CustomFlashcardDeck.is_public == True) |
            (CustomFlashcardDeck.created_by == current_user.id)
        )
    
    if chapter_id:
        query = query.filter(CustomFlashcardDeck.chapter_id == chapter_id)
    
    decks = query.offset(skip).limit(limit).all()
    
    for deck in decks:
        deck.creator_name = deck.creator.full_name or deck.creator.username
        deck.cards_count = len(deck.cards)
    
    return decks


# === STUDY GROUP MANAGEMENT ===

@router.post("/study-groups", response_model=StudyGroupSchema)
def create_study_group(
    group_data: StudyGroupCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau groupe d'étude (enseignants uniquement)"""
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Seuls les enseignants peuvent créer des groupes"
        )
    
    # Générer un code unique
    import string
    import random
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    group = StudyGroup(
        **group_data.dict(),
        teacher_id=current_user.id,
        code=code
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    
    group.teacher_name = current_user.full_name or current_user.username
    group.members_count = 0
    
    return group


@router.post("/study-groups/join/{code}")
def join_study_group(
    code: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rejoindre un groupe d'étude avec un code"""
    group = db.query(StudyGroup).filter(
        StudyGroup.code == code,
        StudyGroup.is_active == True
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Code invalide ou groupe inactif")
    
    # Vérifier si déjà membre
    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group.id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Vous êtes déjà membre de ce groupe")
    
    member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="student"
    )
    db.add(member)
    db.commit()
    
    return {"message": f"Vous avez rejoint le groupe '{group.name}'"}


@router.get("/study-groups/{group_id}/members")
def get_group_members(
    group_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir les membres d'un groupe d'étude"""
    # Vérifier que le groupe existe
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
    
    # Vérifier que l'utilisateur est membre ou enseignant du groupe
    is_teacher = str(group.teacher_id) == str(current_user.id)
    is_member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first() is not None
    
    if not is_teacher and not is_member:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Récupérer les membres
    members = db.query(GroupMember).options(
        joinedload(GroupMember.user)
    ).filter(GroupMember.group_id == group_id).all()
    
    # Formatter la réponse
    members_list = []
    for member in members:
        members_list.append({
            "id": str(member.id),
            "user_id": str(member.user_id),
            "user_name": member.user.full_name or member.user.username,
            "user_email": member.user.email,
            "role": member.role,
            "joined_at": member.joined_at.isoformat()
        })
    
    # Ajouter l'enseignant
    teacher = db.query(UserModel).filter(UserModel.id == group.teacher_id).first()
    if teacher:
        members_list.insert(0, {
            "id": f"teacher-{teacher.id}",
            "user_id": str(teacher.id),
            "user_name": teacher.full_name or teacher.username,
            "user_email": teacher.email,
            "role": "teacher",
            "joined_at": group.created_at.isoformat()
        })
    
    return members_list


# === QUIZ ATTEMPTS ===

@router.post("/quiz-attempts", response_model=QuizAttemptSchema)
def submit_quiz_attempt(
    attempt_data: QuizAttemptCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soumettre une tentative de quiz"""
    # Vérifier que le quiz existe
    quiz = db.query(CustomQuiz).options(
        joinedload(CustomQuiz.questions)
    ).filter(CustomQuiz.id == attempt_data.quiz_id).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz non trouvé")
    
    # Calculer le score
    correct_answers = 0
    total_points = 0
    
    for question in quiz.questions:
        total_points += question.points
        if str(question.id) in attempt_data.answers:
            user_answer = attempt_data.answers[str(question.id)]
            if str(user_answer) == str(question.correct_answer):
                correct_answers += question.points
    
    score = (correct_answers / total_points) if total_points > 0 else 0
    
    # Créer la tentative
    attempt = QuizAttempt(
        quiz_id=attempt_data.quiz_id,
        student_id=current_user.id,
        score=score,
        answers=attempt_data.answers,
        completed_at=datetime.utcnow(),
        time_spent=0  # À calculer côté client
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return attempt


# === IMPORT/EXPORT ===

@router.post("/quizzes/import")
async def import_quiz(
    file: UploadFile = File(...),
    chapter_id: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Importer un quiz depuis un fichier CSV ou JSON"""
    if not is_teacher_or_parent(current_user):
        raise HTTPException(
            status_code=403,
            detail="Seuls les enseignants et parents peuvent importer des quiz"
        )
    
    content = await file.read()
    
    try:
        if file.filename.endswith('.json'):
            data = json.loads(content)
        elif file.filename.endswith('.csv'):
            # Parser le CSV
            csv_file = io.StringIO(content.decode('utf-8'))
            reader = csv.DictReader(csv_file)
            
            questions = []
            for row in reader:
                questions.append({
                    "question_text": row.get("question"),
                    "question_type": row.get("type", "multiple_choice"),
                    "choices": row.get("choices", "").split("|") if row.get("choices") else None,
                    "correct_answer": row.get("answer"),
                    "explanation": row.get("explanation"),
                    "points": int(row.get("points", 1))
                })
            
            data = {
                "title": file.filename.replace('.csv', ''),
                "questions": questions
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Format de fichier non supporté. Utilisez JSON ou CSV."
            )
        
        # Créer le quiz
        quiz_data = QuizCreate(
            title=data.get("title", "Quiz importé"),
            description=data.get("description"),
            chapter_id=chapter_id,
            questions=data["questions"]
        )
        
        return create_quiz(quiz_data, current_user, db)
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur lors de l'import: {str(e)}"
        )


# === PERMISSIONS & SHARING ===

@router.post("/quizzes/{quiz_id}/share")
def share_quiz(
    quiz_id: str,
    share_data: ShareRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Partager un quiz avec un autre utilisateur"""
    quiz = db.query(CustomQuiz).filter(CustomQuiz.id == quiz_id).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz non trouvé")
    
    if quiz.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez partager que vos propres quiz")
    
    # Trouver l'utilisateur cible
    target_user = db.query(UserModel).filter(
        UserModel.email == share_data.user_email
    ).first()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    if not is_teacher_or_parent(target_user):
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez partager qu'avec des enseignants ou parents"
        )
    
    # Vérifier si déjà partagé
    existing = db.query(QuizShare).filter(
        QuizShare.quiz_id == quiz_id,
        QuizShare.shared_with_id == target_user.id
    ).first()
    
    if existing:
        existing.permission = share_data.permission
    else:
        share = QuizShare(
            quiz_id=quiz_id,
            shared_with_id=target_user.id,
            permission=share_data.permission
        )
        db.add(share)
    
    db.commit()
    
    return {"message": f"Quiz partagé avec {target_user.full_name or target_user.username}"}


