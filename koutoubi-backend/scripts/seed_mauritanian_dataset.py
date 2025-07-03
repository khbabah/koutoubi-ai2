#!/usr/bin/env python3
"""
Script pour créer un dataset de test complet dans le contexte éducatif mauritanien
Inclut des enseignants, étudiants, groupes d'étude, quiz et flashcards
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base, SessionLocal
from app.models import User, Chapter, Flashcard, QuizQuestion
from app.models.educational_content import (
    CustomQuiz, CustomQuizQuestion, CustomFlashcardDeck, CustomFlashcard,
    StudyGroup, GroupMember, GroupAssignment, QuizAttempt, FlashcardProgress,
    QuizShare, FlashcardDeckShare, ParentChildLink, AssignmentSubmission
)
from passlib.context import CryptContext
from datetime import datetime, timedelta
import json
import random
import string

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Noms mauritaniens réalistes
PRENOMS_MASCULINS = [
    "Mohamed", "Ahmed", "Sidi", "Cheikh", "Abdallah", "Mahmoud", "El Moctar",
    "Hamza", "Brahim", "Ismail", "Yahya", "Omar", "Ousmane", "Amadou",
    "Bilal", "Moussa", "Sidaty", "El Hadj", "Abdoul", "Mamadou"
]

PRENOMS_FEMININS = [
    "Fatimetou", "Mariem", "Aichetou", "Zeineb", "Khadija", "Aminetou",
    "Salka", "Oum", "Maimouna", "Coumba", "Safietou", "Hawa", "Binta",
    "Lalla", "Nana", "Vatimetou", "Meimouna", "Sira", "Djeneba", "Aicha"
]

NOMS_FAMILLE = [
    "Ould Mohamed", "Mint Ahmed", "Ould Sidi", "Mint Cheikh", "Ould Abdallah",
    "Fall", "Diallo", "Sy", "Ba", "Sow", "Sall", "Camara", "Touré",
    "Ould Brahim", "Mint El Moctar", "Ould Dah", "Mint Saleck", "Kane",
    "Dia", "Seck", "Ndiaye", "Gueye", "Diop", "Sarr", "Mint Habib"
]

# Établissements scolaires mauritaniens
ETABLISSEMENTS = [
    "Lycée National de Nouakchott",
    "Lycée Cheikh Moussa",
    "Lycée de Ksar",
    "Lycée de Tevragh Zeina",
    "Lycée El Mina",
    "Lycée de Rosso",
    "Lycée de Nouadhibou",
    "Lycée Moderne de Kaédi",
    "Lycée d'Excellence de Nouakchott",
    "École Primaire Saad Bouh"
]

# Matières dans le système mauritanien
MATIERES = {
    "mathematiques": "Mathématiques",
    "arabe": "اللغة العربية",
    "francais": "Français",
    "islamique": "التربية الإسلامية",
    "histoire": "Histoire de la Mauritanie",
    "geographie": "Géographie",
    "physique": "Physique-Chimie",
    "sciences": "Sciences de la Vie et de la Terre",
    "anglais": "Anglais",
    "informatique": "Informatique"
}

# Niveaux scolaires
NIVEAUX = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"]

def generate_mauritanian_email(prenom, nom):
    """Génère un email réaliste"""
    clean_prenom = prenom.lower().replace(" ", "").replace("'", "")
    clean_nom = nom.lower().replace(" ", "").replace("'", "")
    domain = random.choice(["gmail.com", "yahoo.fr", "hotmail.com", "outlook.com"])
    
    formats = [
        f"{clean_prenom}.{clean_nom}@{domain}",
        f"{clean_prenom}{clean_nom}@{domain}",
        f"{clean_prenom}_{clean_nom}@{domain}",
        f"{clean_prenom[0]}{clean_nom}@{domain}",
        f"{clean_prenom}{random.randint(1, 99)}@{domain}"
    ]
    
    return random.choice(formats)

def generate_group_code():
    """Génère un code de groupe unique"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def create_users(db):
    """Créer des utilisateurs (enseignants, étudiants, parents)"""
    users = []
    
    # Créer des enseignants
    print("📚 Création des enseignants...")
    for i in range(15):
        prenom = random.choice(PRENOMS_MASCULINS if i % 2 == 0 else PRENOMS_FEMININS)
        nom = random.choice(NOMS_FAMILLE)
        
        teacher = User(
            email=generate_mauritanian_email(prenom, nom),
            username=f"prof_{prenom.lower()}_{i}",
            hashed_password=pwd_context.hash("teacher123"),
            full_name=f"{prenom} {nom}",
            role="teacher",
            is_active=True
        )
        db.add(teacher)
        users.append(teacher)
    
    # Créer des étudiants
    print("👨‍🎓 Création des étudiants...")
    for i in range(60):
        prenom = random.choice(PRENOMS_MASCULINS if i % 2 == 0 else PRENOMS_FEMININS)
        nom = random.choice(NOMS_FAMILLE)
        
        student = User(
            email=generate_mauritanian_email(prenom, nom),
            username=f"eleve_{prenom.lower()}_{i}",
            hashed_password=pwd_context.hash("student123"),
            full_name=f"{prenom} {nom}",
            role="student",
            is_active=True
        )
        db.add(student)
        users.append(student)
    
    # Créer des parents
    print("👪 Création des parents...")
    for i in range(20):
        prenom = random.choice(PRENOMS_MASCULINS if i % 2 == 0 else PRENOMS_FEMININS)
        nom = random.choice(NOMS_FAMILLE)
        
        parent = User(
            email=generate_mauritanian_email(prenom, nom),
            username=f"parent_{prenom.lower()}_{i}",
            hashed_password=pwd_context.hash("parent123"),
            full_name=f"{prenom} {nom}",
            role="parent",
            is_active=True
        )
        db.add(parent)
        users.append(parent)
    
    # Cas spéciaux / edge cases
    print("🔧 Création des cas spéciaux...")
    
    # Utilisateur avec nom très long
    special_user1 = User(
        email="mohamed.ould.abdel.aziz.ould.sidi.mohamed@example.com",
        username="user_nom_tres_long",
        hashed_password=pwd_context.hash("special123"),
        full_name="Mohamed Ould Abdel Aziz Ould Sidi Mohamed Ould Ahmed",
        role="student",
        is_active=True
    )
    db.add(special_user1)
    
    # Utilisateur avec caractères spéciaux
    special_user2 = User(
        email="fatima-mint.el'moctar@example.com",
        username="user_special_chars",
        hashed_password=pwd_context.hash("special123"),
        full_name="Fatima Mint El'Moctar",
        role="student",
        is_active=True
    )
    db.add(special_user2)
    
    # Utilisateur inactif
    inactive_user = User(
        email="inactive@example.com",
        username="user_inactive",
        hashed_password=pwd_context.hash("inactive123"),
        full_name="Utilisateur Inactif",
        role="student",
        is_active=False
    )
    db.add(inactive_user)
    
    db.commit()
    return users

def create_chapters(db):
    """Créer des chapitres pour différentes matières"""
    chapters = []
    
    print("📖 Création des chapitres...")
    
    # Mathématiques
    math_chapters = [
        {"numero": 1, "title": "Les nombres décimaux et opérations", "niveau": "6ème"},
        {"numero": 2, "title": "Proportionnalité et pourcentages", "niveau": "5ème"},
        {"numero": 3, "title": "Équations du premier degré", "niveau": "4ème"},
        {"numero": 4, "title": "Théorème de Pythagore", "niveau": "4ème"},
        {"numero": 5, "title": "Fonctions affines", "niveau": "3ème"},
        {"numero": 6, "title": "Probabilités", "niveau": "2nde"},
        {"numero": 7, "title": "Dérivation", "niveau": "1ère"},
        {"numero": 8, "title": "Intégrales", "niveau": "Terminale"}
    ]
    
    for ch in math_chapters:
        chapter = Chapter(
            numero=ch["numero"],
            title=ch["title"],
            niveau=ch["niveau"],
            matiere="mathematiques",
            pdf_path=f"/pdfs/math_{ch['niveau']}.pdf"
        )
        db.add(chapter)
        chapters.append(chapter)
    
    # Arabe
    arabic_chapters = [
        {"numero": 1, "title": "القواعد الأساسية", "niveau": "6ème"},
        {"numero": 2, "title": "النحو والصرف", "niveau": "5ème"},
        {"numero": 3, "title": "البلاغة العربية", "niveau": "4ème"},
        {"numero": 4, "title": "الأدب الجاهلي", "niveau": "3ème"},
        {"numero": 5, "title": "الشعر العباسي", "niveau": "2nde"},
        {"numero": 6, "title": "النثر الحديث", "niveau": "1ère"},
        {"numero": 7, "title": "الأدب المعاصر", "niveau": "Terminale"}
    ]
    
    for ch in arabic_chapters:
        chapter = Chapter(
            numero=ch["numero"],
            title=ch["title"],
            niveau=ch["niveau"],
            matiere="arabe",
            pdf_path=f"/pdfs/arabic_{ch['niveau']}.pdf"
        )
        db.add(chapter)
        chapters.append(chapter)
    
    # Sciences islamiques
    islamic_chapters = [
        {"numero": 1, "title": "أركان الإسلام", "niveau": "6ème"},
        {"numero": 2, "title": "السيرة النبوية", "niveau": "5ème"},
        {"numero": 3, "title": "الفقه الإسلامي", "niveau": "4ème"},
        {"numero": 4, "title": "علوم القرآن", "niveau": "3ème"},
        {"numero": 5, "title": "الحديث الشريف", "niveau": "2nde"},
        {"numero": 6, "title": "أصول الفقه", "niveau": "1ère"},
        {"numero": 7, "title": "المقاصد الشرعية", "niveau": "Terminale"}
    ]
    
    for ch in islamic_chapters:
        chapter = Chapter(
            numero=ch["numero"],
            title=ch["title"],
            niveau=ch["niveau"],
            matiere="islamique",
            pdf_path=f"/pdfs/islamic_{ch['niveau']}.pdf"
        )
        db.add(chapter)
        chapters.append(chapter)
    
    # Histoire de la Mauritanie
    history_chapters = [
        {"numero": 1, "title": "L'Empire du Ghana et les Almoravides", "niveau": "6ème"},
        {"numero": 2, "title": "Les Émirats maures", "niveau": "5ème"},
        {"numero": 3, "title": "La colonisation française", "niveau": "4ème"},
        {"numero": 4, "title": "L'indépendance et Moktar Ould Daddah", "niveau": "3ème"},
        {"numero": 5, "title": "La Mauritanie moderne", "niveau": "2nde"},
        {"numero": 6, "title": "Les ressources naturelles", "niveau": "1ère"},
        {"numero": 7, "title": "La Mauritanie dans le monde", "niveau": "Terminale"}
    ]
    
    for ch in history_chapters:
        chapter = Chapter(
            numero=ch["numero"],
            title=ch["title"],
            niveau=ch["niveau"],
            matiere="histoire",
            pdf_path=f"/pdfs/history_{ch['niveau']}.pdf"
        )
        db.add(chapter)
        chapters.append(chapter)
    
    # Géographie
    geography_chapters = [
        {"numero": 1, "title": "Le Sahara mauritanien", "niveau": "6ème"},
        {"numero": 2, "title": "Le fleuve Sénégal", "niveau": "5ème"},
        {"numero": 3, "title": "Les villes mauritaniennes", "niveau": "4ème"},
        {"numero": 4, "title": "Le climat et l'environnement", "niveau": "3ème"},
        {"numero": 5, "title": "L'économie mauritanienne", "niveau": "2nde"},
        {"numero": 6, "title": "Les ressources minières", "niveau": "1ère"},
        {"numero": 7, "title": "La pêche et l'agriculture", "niveau": "Terminale"}
    ]
    
    for ch in geography_chapters:
        chapter = Chapter(
            numero=ch["numero"],
            title=ch["title"],
            niveau=ch["niveau"],
            matiere="geographie",
            pdf_path=f"/pdfs/geography_{ch['niveau']}.pdf"
        )
        db.add(chapter)
        chapters.append(chapter)
    
    db.commit()
    return chapters

def create_study_groups(db, teachers, students):
    """Créer des groupes d'étude"""
    groups = []
    
    print("👥 Création des groupes d'étude...")
    
    # Groupes normaux
    for i, teacher in enumerate(teachers[:10]):
        niveau = random.choice(NIVEAUX)
        matiere = random.choice(list(MATIERES.keys()))
        
        group = StudyGroup(
            name=f"Classe de {MATIERES[matiere]} - {niveau}",
            description=f"Groupe d'étude pour {MATIERES[matiere]} niveau {niveau}",
            code=generate_group_code(),
            teacher_id=teacher.id,
            school_name=random.choice(ETABLISSEMENTS),
            grade_level=niveau,
            subject=matiere,
            is_active=True
        )
        db.add(group)
        db.flush()  # Force flush to get the group ID
        groups.append(group)
        
        # Ajouter des membres (5-15 étudiants par groupe)
        num_members = random.randint(5, 15)
        selected_students = random.sample(students, num_members)
        
        for student in selected_students:
            member = GroupMember(
                group_id=group.id,
                user_id=student.id,
                role="student"
            )
            db.add(member)
    
    # Cas spéciaux
    
    # Groupe vide
    empty_group = StudyGroup(
        name="Groupe Test Vide",
        description="Groupe sans membres pour tester",
        code=generate_group_code(),
        teacher_id=teachers[10].id,
        school_name=ETABLISSEMENTS[0],
        grade_level="3ème",
        subject="mathematiques",
        is_active=True
    )
    db.add(empty_group)
    db.flush()
    
    # Groupe inactif
    inactive_group = StudyGroup(
        name="Ancien Groupe 2023",
        description="Groupe de l'année dernière",
        code=generate_group_code(),
        teacher_id=teachers[11].id,
        school_name=ETABLISSEMENTS[1],
        grade_level="Terminale",
        subject="physique",
        is_active=False
    )
    db.add(inactive_group)
    db.flush()
    
    # Groupe avec beaucoup de membres
    large_group = StudyGroup(
        name="Grande Classe de Français",
        description="Classe nombreuse",
        code=generate_group_code(),
        teacher_id=teachers[12].id,
        school_name=ETABLISSEMENTS[2],
        grade_level="2nde",
        subject="francais",
        is_active=True
    )
    db.add(large_group)
    db.flush()  # Force flush to get the group ID
    groups.append(large_group)
    
    # Ajouter 30 membres
    for student in students[:30]:
        member = GroupMember(
            group_id=large_group.id,
            user_id=student.id,
            role="student"
        )
        db.add(member)
    
    db.commit()
    return groups

def create_custom_quizzes(db, teachers, chapters, groups):
    """Créer des quiz personnalisés"""
    quizzes = []
    
    print("📝 Création des quiz personnalisés...")
    
    # Quiz de mathématiques
    math_quiz = CustomQuiz(
        title="Test sur les équations du premier degré",
        description="Quiz pour évaluer la compréhension des équations",
        chapter_id=chapters[2].id,  # Équations du premier degré
        created_by=teachers[0].id,
        difficulty="medium",
        time_limit=30,
        pass_score=0.6,
        is_public=True,
        tags=json.dumps(["équations", "algèbre", "4ème"])
    )
    db.add(math_quiz)
    db.flush()  # Get the quiz ID
    quizzes.append(math_quiz)
    
    # Questions pour le quiz de maths
    math_questions = [
        {
            "question_text": "Résoudre l'équation : 2x + 5 = 13",
            "question_type": "multiple_choice",
            "choices": json.dumps(["x = 4", "x = 8", "x = 9", "x = 3"]),
            "correct_answer": "0",
            "explanation": "2x + 5 = 13 → 2x = 8 → x = 4",
            "points": 2,
            "order": 1
        },
        {
            "question_text": "L'équation 3x - 7 = 2x + 1 a pour solution :",
            "question_type": "multiple_choice",
            "choices": json.dumps(["x = 8", "x = 6", "x = -8", "x = -6"]),
            "correct_answer": "0",
            "explanation": "3x - 7 = 2x + 1 → x = 8",
            "points": 3,
            "order": 2
        },
        {
            "question_text": "Une équation du premier degré a toujours une solution unique.",
            "question_type": "true_false",
            "choices": json.dumps(["Vrai", "Faux"]),
            "correct_answer": "1",
            "explanation": "Faux : 0x = 5 n'a pas de solution, et 0x = 0 a une infinité de solutions",
            "points": 2,
            "order": 3
        }
    ]
    
    for q_data in math_questions:
        question = CustomQuizQuestion(
            quiz_id=math_quiz.id,
            **q_data
        )
        db.add(question)
    
    # Quiz d'arabe
    arabic_quiz = CustomQuiz(
        title="اختبار في القواعد العربية",
        description="اختبار لتقييم فهم القواعد الأساسية",
        chapter_id=chapters[8].id,  # القواعد الأساسية
        created_by=teachers[1].id,
        difficulty="easy",
        time_limit=20,
        pass_score=0.7,
        is_public=True,
        tags=json.dumps(["نحو", "قواعد", "6ème"])
    )
    db.add(arabic_quiz)
    db.flush()  # Get the quiz ID
    quizzes.append(arabic_quiz)
    
    # Questions pour le quiz d'arabe
    arabic_questions = [
        {
            "question_text": "ما هو جمع كلمة 'كتاب'؟",
            "question_type": "multiple_choice",
            "choices": json.dumps(["كتب", "كتابات", "كتبة", "أكتاب"]),
            "correct_answer": "0",
            "explanation": "جمع كتاب هو كُتُب",
            "points": 1,
            "order": 1
        },
        {
            "question_text": "الفعل 'كَتَبَ' هو فعل:",
            "question_type": "multiple_choice",
            "choices": json.dumps(["ماضٍ", "مضارع", "أمر", "اسم"]),
            "correct_answer": "0",
            "explanation": "كَتَبَ فعل ماضٍ ثلاثي",
            "points": 1,
            "order": 2
        }
    ]
    
    for q_data in arabic_questions:
        question = CustomQuizQuestion(
            quiz_id=arabic_quiz.id,
            **q_data
        )
        db.add(question)
    
    # Quiz d'histoire
    history_quiz = CustomQuiz(
        title="L'indépendance de la Mauritanie",
        description="Quiz sur l'histoire de l'indépendance mauritanienne",
        chapter_id=chapters[18].id,  # L'indépendance
        created_by=teachers[2].id,
        difficulty="medium",
        time_limit=25,
        pass_score=0.65,
        is_public=False,
        tags=json.dumps(["histoire", "indépendance", "3ème"])
    )
    db.add(history_quiz)
    db.flush()  # Get the quiz ID
    quizzes.append(history_quiz)
    
    # Questions d'histoire
    history_questions = [
        {
            "question_text": "En quelle année la Mauritanie a-t-elle obtenu son indépendance ?",
            "question_type": "multiple_choice",
            "choices": json.dumps(["1958", "1960", "1962", "1964"]),
            "correct_answer": "1",
            "explanation": "La Mauritanie a obtenu son indépendance le 28 novembre 1960",
            "points": 2,
            "order": 1
        },
        {
            "question_text": "Qui était le premier président de la Mauritanie ?",
            "question_type": "multiple_choice",
            "choices": json.dumps([
                "Moktar Ould Daddah",
                "Maaouya Ould Sid'Ahmed Taya",
                "Mohamed Ould Abdel Aziz",
                "Sidi Ould Cheikh Abdallahi"
            ]),
            "correct_answer": "0",
            "explanation": "Moktar Ould Daddah fut le premier président de 1960 à 1978",
            "points": 2,
            "order": 2
        },
        {
            "question_text": "Quelle était la capitale de la Mauritanie avant Nouakchott ?",
            "question_type": "short_answer",
            "choices": json.dumps([]),
            "correct_answer": "Saint-Louis",
            "explanation": "Saint-Louis (Sénégal) était la capitale administrative avant la création de Nouakchott",
            "points": 3,
            "order": 3
        }
    ]
    
    for q_data in history_questions:
        question = CustomQuizQuestion(
            quiz_id=history_quiz.id,
            **q_data
        )
        db.add(question)
    
    # Quiz avec cas spéciaux
    
    # Quiz sans questions (edge case)
    empty_quiz = CustomQuiz(
        title="Quiz Test Vide",
        description="Quiz sans questions pour tester",
        created_by=teachers[3].id,
        difficulty="easy",
        time_limit=10,
        pass_score=0.5,
        is_public=False,
        tags=json.dumps([])
    )
    db.add(empty_quiz)
    db.flush()  # Get the quiz ID
    
    # Quiz avec beaucoup de questions
    large_quiz = CustomQuiz(
        title="Grand Test de Géographie",
        description="Test complet sur la géographie mauritanienne",
        chapter_id=chapters[22].id,  # Le Sahara mauritanien
        created_by=teachers[4].id,
        difficulty="hard",
        time_limit=60,
        pass_score=0.7,
        is_public=True,
        tags=json.dumps(["géographie", "Sahara", "climat", "6ème"])
    )
    db.add(large_quiz)
    db.flush()  # Get the quiz ID
    quizzes.append(large_quiz)
    
    # Ajouter 20 questions
    for i in range(20):
        question = CustomQuizQuestion(
            quiz_id=large_quiz.id,
            question_text=f"Question {i+1} sur le Sahara mauritanien",
            question_type="multiple_choice",
            choices=json.dumps(["Option A", "Option B", "Option C", "Option D"]),
            correct_answer=str(random.randint(0, 3)),
            explanation=f"Explication pour la question {i+1}",
            points=random.randint(1, 3),
            order=i+1
        )
        db.add(question)
    
    db.commit()
    return quizzes

def create_flashcard_decks(db, teachers, chapters):
    """Créer des decks de flashcards"""
    decks = []
    
    print("🎴 Création des decks de flashcards...")
    
    # Deck de vocabulaire français
    french_deck = CustomFlashcardDeck(
        title="Vocabulaire français niveau 5ème",
        description="Mots importants à connaître en français",
        created_by=teachers[0].id,
        is_public=True,
        tags=json.dumps(["vocabulaire", "français", "5ème"])
    )
    db.add(french_deck)
    db.flush()  # Get the deck ID
    decks.append(french_deck)
    
    # Cartes de vocabulaire français
    french_cards = [
        {"front": "Ephémère", "back": "Qui dure très peu de temps"},
        {"front": "Altruisme", "back": "Disposition à s'intéresser et à se dévouer à autrui"},
        {"front": "Paradoxe", "back": "Opinion contraire à l'opinion commune"},
        {"front": "Empathie", "back": "Capacité de ressentir les émotions d'autrui"},
        {"front": "Résilience", "back": "Capacité à surmonter les épreuves"}
    ]
    
    for card_data in french_cards:
        card = CustomFlashcard(
            deck_id=french_deck.id,
            front_text=card_data["front"],
            back_text=card_data["back"],
            difficulty=random.randint(1, 3)
        )
        db.add(card)
    
    # Deck de formules mathématiques
    math_deck = CustomFlashcardDeck(
        title="Formules mathématiques - Géométrie",
        description="Formules importantes de géométrie",
        chapter_id=chapters[3].id,  # Théorème de Pythagore
        created_by=teachers[1].id,
        is_public=True,
        tags=json.dumps(["formules", "géométrie", "4ème"])
    )
    db.add(math_deck)
    db.flush()  # Get the deck ID
    decks.append(math_deck)
    
    # Cartes de maths
    math_cards = [
        {"front": "Théorème de Pythagore", "back": "Dans un triangle rectangle : a² + b² = c²"},
        {"front": "Aire d'un cercle", "back": "A = πr²"},
        {"front": "Périmètre d'un cercle", "back": "P = 2πr"},
        {"front": "Aire d'un triangle", "back": "A = (base × hauteur) / 2"},
        {"front": "Volume d'un cube", "back": "V = côté³"}
    ]
    
    for card_data in math_cards:
        card = CustomFlashcard(
            deck_id=math_deck.id,
            front_text=card_data["front"],
            back_text=card_data["back"],
            difficulty=2
        )
        db.add(card)
    
    # Deck de dates historiques
    history_deck = CustomFlashcardDeck(
        title="Dates importantes de l'histoire mauritanienne",
        description="Chronologie de l'histoire nationale",
        created_by=teachers[2].id,
        is_public=True,
        tags=json.dumps(["dates", "histoire", "Mauritanie"])
    )
    db.add(history_deck)
    db.flush()  # Get the deck ID
    decks.append(history_deck)
    
    # Cartes d'histoire
    history_cards = [
        {"front": "Indépendance de la Mauritanie", "back": "28 novembre 1960"},
        {"front": "Fondation de Nouakchott", "back": "1957"},
        {"front": "Abolition de l'esclavage", "back": "1981"},
        {"front": "Création de l'ouguiya", "back": "1973"},
        {"front": "Découverte du fer à Zouerate", "back": "1952"}
    ]
    
    for card_data in history_cards:
        card = CustomFlashcard(
            deck_id=history_deck.id,
            front_text=card_data["front"],
            back_text=card_data["back"],
            difficulty=2
        )
        db.add(card)
    
    # Deck islamique
    islamic_deck = CustomFlashcardDeck(
        title="أسماء الله الحسنى",
        description="Les 99 noms d'Allah à mémoriser",
        chapter_id=chapters[15].id,  # أركان الإسلام
        created_by=teachers[3].id,
        is_public=True,
        tags=json.dumps(["islam", "أسماء الله", "mémorisation"])
    )
    db.add(islamic_deck)
    db.flush()  # Get the deck ID
    decks.append(islamic_deck)
    
    # Quelques noms d'Allah
    islamic_cards = [
        {"front": "الرحمن", "back": "Le Tout Miséricordieux"},
        {"front": "الرحيم", "back": "Le Très Miséricordieux"},
        {"front": "الملك", "back": "Le Souverain"},
        {"front": "القدوس", "back": "Le Très Saint"},
        {"front": "السلام", "back": "La Paix"},
        {"front": "المؤمن", "back": "Le Confiant"},
        {"front": "المهيمن", "back": "Le Dominateur"},
        {"front": "العزيز", "back": "Le Tout Puissant"},
        {"front": "الجبار", "back": "Le Contraignant"},
        {"front": "المتكبر", "back": "Le Superbe"}
    ]
    
    for card_data in islamic_cards:
        card = CustomFlashcard(
            deck_id=islamic_deck.id,
            front_text=card_data["front"],
            back_text=card_data["back"],
            difficulty=1
        )
        db.add(card)
    
    # Cas spéciaux
    
    # Deck vide
    empty_deck = CustomFlashcardDeck(
        title="Deck Test Vide",
        description="Deck sans cartes pour tester",
        created_by=teachers[4].id,
        is_public=False,
        tags=json.dumps([])
    )
    db.add(empty_deck)
    db.flush()  # Get the deck ID
    
    # Deck avec beaucoup de cartes
    large_deck = CustomFlashcardDeck(
        title="Vocabulaire arabe complet",
        description="1000 mots arabes essentiels",
        created_by=teachers[5].id,
        is_public=True,
        tags=json.dumps(["arabe", "vocabulaire", "complet"])
    )
    db.add(large_deck)
    db.flush()  # Get the deck ID
    decks.append(large_deck)
    
    # Ajouter 50 cartes (simulation)
    arabic_words = [
        "كتاب", "قلم", "مدرسة", "طالب", "معلم", "درس", "صف", "امتحان",
        "واجب", "مكتبة", "حاسوب", "علم", "رياضيات", "تاريخ", "جغرافيا"
    ]
    
    for i in range(50):
        word = random.choice(arabic_words)
        card = CustomFlashcard(
            deck_id=large_deck.id,
            front_text=f"{word} ({i+1})",
            back_text=f"Traduction de {word}",
            difficulty=random.randint(1, 5)
        )
        db.add(card)
    
    db.commit()
    return decks

def create_assignments_and_attempts(db, groups, quizzes, decks, students):
    """Créer des devoirs et des tentatives"""
    
    print("📋 Création des devoirs et tentatives...")
    
    # Créer des devoirs pour les groupes
    for i, group in enumerate(groups[:5]):
        # Devoir de quiz
        quiz_assignment = GroupAssignment(
            group_id=group.id,
            quiz_id=quizzes[i % len(quizzes)].id,
            title=f"Devoir {i+1} - {quizzes[i % len(quizzes)].title}",
            description="À compléter avant la fin de la semaine",
            due_date=datetime.utcnow() + timedelta(days=7),
            points=20
        )
        db.add(quiz_assignment)
        
        # Devoir de flashcards
        if i < len(decks):
            flashcard_assignment = GroupAssignment(
                group_id=group.id,
                flashcard_deck_id=decks[i % len(decks)].id,
                title=f"Révision - {decks[i % len(decks)].title}",
                description="Mémoriser toutes les cartes",
                due_date=datetime.utcnow() + timedelta(days=14),
                points=10
            )
            db.add(flashcard_assignment)
    
    db.commit()
    
    # Créer des tentatives de quiz
    for quiz in quizzes[:3]:
        # Quelques étudiants tentent le quiz
        for student in random.sample(students, min(10, len(students))):
            attempt = QuizAttempt(
                quiz_id=quiz.id,
                student_id=student.id,
                score=random.uniform(0.3, 1.0),
                time_spent=random.randint(300, 1800),  # 5-30 minutes
                answers=json.dumps({
                    "q1": random.randint(0, 3),
                    "q2": random.randint(0, 3),
                    "q3": random.choice([True, False])
                }),
                completed_at=datetime.utcnow()
            )
            db.add(attempt)
    
    # Créer de la progression sur les flashcards
    for deck in decks[:3]:
        if deck.cards:
            for student in random.sample(students, min(5, len(students))):
                for card in random.sample(deck.cards, min(3, len(deck.cards))):
                    progress = FlashcardProgress(
                        flashcard_id=card.id,
                        student_id=student.id,
                        ease_factor=random.uniform(1.5, 3.0),
                        interval=random.randint(1, 30),
                        repetitions=random.randint(0, 10),
                        last_reviewed=datetime.utcnow() - timedelta(days=random.randint(0, 10)),
                        next_review=datetime.utcnow() + timedelta(days=random.randint(1, 30))
                    )
                    db.add(progress)
    
    db.commit()

def create_parent_child_links(db, parents, students):
    """Créer des liens parent-enfant"""
    
    print("👨‍👩‍👧‍👦 Création des liens parent-enfant...")
    
    # Chaque parent a 1-3 enfants
    for parent in parents[:15]:
        num_children = random.randint(1, 3)
        children = random.sample(students, min(num_children, len(students)))
        
        for child in children:
            link = ParentChildLink(
                parent_id=parent.id,
                child_id=child.id,
                verified=random.choice([True, True, False])  # 2/3 vérifiés
            )
            db.add(link)
    
    db.commit()

def create_shares(db, teachers, quizzes, decks):
    """Créer des partages entre enseignants"""
    
    print("🤝 Création des partages...")
    
    # Partager quelques quiz
    for quiz in quizzes[:3]:
        if quiz.is_public:
            # Partager avec 2-3 autres enseignants
            other_teachers = [t for t in teachers if t.id != quiz.created_by]
            for teacher in random.sample(other_teachers, min(3, len(other_teachers))):
                share = QuizShare(
                    quiz_id=quiz.id,
                    shared_with_id=teacher.id,
                    permission=random.choice(["view", "edit", "duplicate"])
                )
                db.add(share)
    
    # Partager quelques decks
    for deck in decks[:3]:
        if deck.is_public:
            other_teachers = [t for t in teachers if t.id != deck.created_by]
            for teacher in random.sample(other_teachers, min(2, len(other_teachers))):
                share = FlashcardDeckShare(
                    deck_id=deck.id,
                    shared_with_id=teacher.id,
                    permission=random.choice(["view", "duplicate"])
                )
                db.add(share)
    
    db.commit()

def add_edge_cases(db):
    """Ajouter des cas limites pour tester la robustesse"""
    
    print("🔧 Ajout des cas limites...")
    
    # Utilisateur avec email très long
    edge_user1 = User(
        email="cet.utilisateur.a.un.email.extremement.long.pour.tester.les.limites@domaine-avec-tirets-et-tout.co.mr",
        username="user_email_long",
        hashed_password=pwd_context.hash("edge123"),
        full_name="Test Email Long",
        role="student",
        is_active=True
    )
    db.add(edge_user1)
    db.flush()  # Get the user ID
    
    # Quiz avec titre très long
    edge_quiz = CustomQuiz(
        title="Ce quiz a un titre extrêmement long pour tester comment l'interface gère les titres qui dépassent les limites normales d'affichage dans l'application",
        description="Description normale",
        created_by=edge_user1.id,
        difficulty="medium",
        time_limit=30,
        pass_score=0.7,
        is_public=False,
        tags=json.dumps(["test", "limite"])
    )
    db.add(edge_quiz)
    
    # Flashcard avec beaucoup de texte
    edge_deck = CustomFlashcardDeck(
        title="Deck avec cartes complexes",
        description="Test des limites de texte",
        created_by=edge_user1.id,
        is_public=False,
        tags=json.dumps(["test"])
    )
    db.add(edge_deck)
    db.flush()  # Get the deck ID
    
    edge_card = CustomFlashcard(
        deck_id=edge_deck.id,
        front_text="Cette carte a une question très longue qui pourrait poser des problèmes d'affichage. " * 10,
        back_text="La réponse est également très longue pour tester les limites. " * 10,
        difficulty=5
    )
    db.add(edge_card)
    
    # Groupe avec code déjà utilisé (devrait échouer)
    try:
        duplicate_group = StudyGroup(
            name="Groupe avec code dupliqué",
            description="Test d'unicité",
            code="ABC123",  # Code simple qui pourrait déjà exister
            teacher_id=edge_user1.id,
            school_name="Test School",
            grade_level="3ème",
            subject="test",
            is_active=True
        )
        db.add(duplicate_group)
        db.commit()
    except:
        db.rollback()
        print("  ⚠️  Duplication de code détectée (comportement attendu)")
    
    db.commit()
    print("✅ Cas limites ajoutés")

def print_statistics(db):
    """Afficher les statistiques du dataset créé"""
    
    print("\n📊 STATISTIQUES DU DATASET")
    print("=" * 50)
    
    stats = {
        "Utilisateurs": db.query(User).count(),
        "  - Enseignants": db.query(User).filter_by(role="teacher").count(),
        "  - Étudiants": db.query(User).filter_by(role="student").count(),
        "  - Parents": db.query(User).filter_by(role="parent").count(),
        "  - Actifs": db.query(User).filter_by(is_active=True).count(),
        "  - Inactifs": db.query(User).filter_by(is_active=False).count(),
        "Chapitres": db.query(Chapter).count(),
        "Groupes d'étude": db.query(StudyGroup).count(),
        "  - Actifs": db.query(StudyGroup).filter_by(is_active=True).count(),
        "  - Inactifs": db.query(StudyGroup).filter_by(is_active=False).count(),
        "Membres de groupes": db.query(GroupMember).count(),
        "Quiz personnalisés": db.query(CustomQuiz).count(),
        "  - Publics": db.query(CustomQuiz).filter_by(is_public=True).count(),
        "  - Privés": db.query(CustomQuiz).filter_by(is_public=False).count(),
        "Questions de quiz": db.query(CustomQuizQuestion).count(),
        "Decks de flashcards": db.query(CustomFlashcardDeck).count(),
        "Flashcards": db.query(CustomFlashcard).count(),
        "Devoirs assignés": db.query(GroupAssignment).count(),
        "Tentatives de quiz": db.query(QuizAttempt).count(),
        "Progressions flashcards": db.query(FlashcardProgress).count(),
        "Liens parent-enfant": db.query(ParentChildLink).count(),
        "  - Vérifiés": db.query(ParentChildLink).filter_by(verified=True).count(),
        "Partages de quiz": db.query(QuizShare).count(),
        "Partages de decks": db.query(FlashcardDeckShare).count()
    }
    
    for key, value in stats.items():
        print(f"{key}: {value}")
    
    print("\n✨ Dataset créé avec succès!")

def main():
    """Fonction principale"""
    print("🚀 Création du dataset de test mauritanien...")
    print("=" * 50)
    
    # Créer toutes les tables
    Base.metadata.create_all(bind=engine)
    
    # Créer une session
    db = SessionLocal()
    
    try:
        # Nettoyer les données existantes - activé par défaut pour le dataset de test
        print("🧹 Nettoyage des données existantes...")
        # Supprimer dans l'ordre inverse des dépendances
        try:
            db.query(AssignmentSubmission).delete()
            db.query(FlashcardProgress).delete()
            db.query(QuizAttempt).delete()
            db.query(GroupAssignment).delete()
            db.query(FlashcardDeckShare).delete()
            db.query(QuizShare).delete()
            db.query(ParentChildLink).delete()
            db.query(GroupMember).delete()
            db.query(CustomFlashcard).delete()
            db.query(CustomFlashcardDeck).delete()
            db.query(CustomQuizQuestion).delete()
            db.query(CustomQuiz).delete()
            db.query(StudyGroup).delete()
            db.query(QuizQuestion).delete()
            db.query(Flashcard).delete()
            db.query(Chapter).delete()
            db.query(User).delete()
            db.commit()
            print("✅ Données existantes supprimées")
        except Exception as e:
            print(f"⚠️  Nettoyage partiel : {e}")
            db.rollback()
        
        # Créer les données
        teachers = [u for u in create_users(db) if u.role == "teacher"]
        students = [u for u in db.query(User).filter_by(role="student").all()]
        parents = [u for u in db.query(User).filter_by(role="parent").all()]
        
        chapters = create_chapters(db)
        groups = create_study_groups(db, teachers, students)
        quizzes = create_custom_quizzes(db, teachers, chapters, groups)
        decks = create_flashcard_decks(db, teachers, chapters)
        
        create_assignments_and_attempts(db, groups, quizzes, decks, students)
        create_parent_child_links(db, parents, students)
        create_shares(db, teachers, quizzes, decks)
        add_edge_cases(db)
        
        # Afficher les statistiques
        print_statistics(db)
        
        # Afficher quelques identifiants de test
        print("\n🔑 IDENTIFIANTS DE TEST")
        print("=" * 50)
        print("Enseignant : prof_mohamed_0 / teacher123")
        print("Étudiant : eleve_fatimetou_1 / student123")
        print("Parent : parent_sidi_0 / parent123")
        print("\n💡 Tous les mots de passe suivent le pattern : role123")
        
    except Exception as e:
        print(f"❌ Erreur : {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()