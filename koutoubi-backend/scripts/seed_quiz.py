#!/usr/bin/env python3
"""Script to seed quiz questions in the database"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.quiz import QuizQuestion
from app.models.chapter import Chapter
from app.models.user import generate_uuid
import json

def create_quiz_questions():
    db = SessionLocal()
    
    try:
        # Get the test chapter
        chapter = db.query(Chapter).filter_by(title="Programmation en langage Python").first()
        if not chapter:
            print("Chapter not found! Please run seed_flashcards.py first.")
            return
        
        # Sample quiz questions
        quiz_data = [
            {
                "type": "multiple_choice",
                "question": "Quel mot-clé est utilisé pour définir une fonction en Python?",
                "choices": ["function", "def", "func", "define"],
                "correct_answer": 1,  # Index 1 = "def"
                "explanation": "En Python, on utilise le mot-clé 'def' pour définir une fonction.",
                "key_info": ["def", "fonction", "définition"]
            },
            {
                "type": "multiple_choice",
                "question": "Quelle est la sortie de: print(type([]))?",
                "choices": ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"],
                "correct_answer": 0,
                "explanation": "[] représente une liste vide en Python, donc type([]) retourne <class 'list'>.",
                "key_info": ["type", "list", "classe"]
            },
            {
                "type": "multiple_choice",
                "question": "Comment créer un dictionnaire vide en Python?",
                "choices": ["dict = []", "dict = {}", "dict = ()", "dict = <>"],
                "correct_answer": 1,
                "explanation": "Les accolades {} sont utilisées pour créer un dictionnaire vide en Python.",
                "key_info": ["dictionnaire", "création", "vide"]
            },
            {
                "type": "multiple_choice",
                "question": "Quelle boucle est utilisée pour itérer un nombre spécifique de fois?",
                "choices": ["while", "foreach", "for", "repeat"],
                "correct_answer": 2,
                "explanation": "La boucle 'for' est généralement utilisée avec range() pour itérer un nombre spécifique de fois.",
                "key_info": ["boucle", "for", "itération"]
            },
            {
                "type": "multiple_choice",
                "question": "Quel opérateur est utilisé pour la division entière en Python?",
                "choices": ["/", "//", "%", "div"],
                "correct_answer": 1,
                "explanation": "L'opérateur // effectue une division entière en Python, retournant la partie entière du résultat.",
                "key_info": ["division", "entière", "opérateur"]
            }
        ]
        
        # Add quiz questions to database
        for data in quiz_data:
            question = db.query(QuizQuestion).filter_by(
                chapter_id=chapter.id,
                question=data["question"]
            ).first()
            
            if not question:
                question = QuizQuestion(
                    chapter_id=chapter.id,
                    type=data["type"],
                    question=data["question"],
                    choices=json.dumps(data["choices"]),
                    correct_answer=data["correct_answer"],
                    explanation=data.get("explanation"),
                    key_info=json.dumps(data.get("key_info", [])),
                    source="manual"
                )
                db.add(question)
                print(f"Created quiz question: {data['question'][:50]}...")
            else:
                print(f"Quiz question already exists: {data['question'][:50]}...")
        
        db.commit()
        print("\nQuiz questions seeded successfully!")
        
        # Show count
        count = db.query(QuizQuestion).filter_by(chapter_id=chapter.id).count()
        print(f"Total quiz questions for chapter '{chapter.title}': {count}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_quiz_questions()