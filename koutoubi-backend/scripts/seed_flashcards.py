#!/usr/bin/env python3
"""Script to seed flashcards in the database"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.flashcard import Flashcard
from app.models.chapter import Chapter
from app.models.user import generate_uuid
import json

def create_flashcards():
    db = SessionLocal()
    
    try:
        # Create a test chapter if it doesn't exist
        chapter = db.query(Chapter).filter_by(title="Programmation en langage Python").first()
        if not chapter:
            chapter = Chapter(
                id="ch1",
                numero=1,
                title="Programmation en langage Python",
                niveau="4eme Secondaire",
                matiere="Mathématiques",
                page_start=17,
                page_end=44
            )
            db.add(chapter)
            db.commit()
        
        # Sample flashcards data
        flashcards_data = [
            {
                "type": "definition",
                "question": "Qu'est-ce qu'une variable en Python?",
                "answer": "Une variable est un conteneur pour stocker des données qui peuvent être modifiées pendant l'exécution du programme.",
                "example": "x = 5\nnom = 'Ahmed'\npi = 3.14",
                "difficulty": "easy"
            },
            {
                "type": "concept",
                "question": "Quelle est la différence entre une liste et un tuple en Python?",
                "answer": "Une liste est modifiable (mutable) et utilise des crochets [], tandis qu'un tuple est immuable et utilise des parenthèses ().",
                "example": "liste = [1, 2, 3]  # Peut être modifiée\ntuple = (1, 2, 3)  # Ne peut pas être modifié",
                "difficulty": "medium"
            },
            {
                "type": "method",
                "question": "Comment définir une fonction en Python?",
                "answer": "On utilise le mot-clé 'def' suivi du nom de la fonction et des paramètres entre parenthèses.",
                "example": "def calculer_somme(a, b):\n    return a + b",
                "difficulty": "easy"
            },
            {
                "type": "formula",
                "question": "Quelle est la syntaxe d'une boucle for en Python?",
                "answer": "for variable in sequence:\n    # code à exécuter",
                "example": "for i in range(5):\n    print(i)",
                "difficulty": "easy"
            },
            {
                "type": "concept",
                "question": "Qu'est-ce que l'indentation en Python et pourquoi est-elle importante?",
                "answer": "L'indentation est l'espacement au début des lignes de code. Elle est obligatoire en Python pour définir les blocs de code.",
                "example": "if x > 0:\n    print('Positif')  # Indenté\nelse:\n    print('Négatif')  # Indenté",
                "difficulty": "medium"
            }
        ]
        
        # Add flashcards to database
        for data in flashcards_data:
            flashcard = db.query(Flashcard).filter_by(
                chapter_id=chapter.id,
                question=data["question"]
            ).first()
            
            if not flashcard:
                flashcard = Flashcard(
                    chapter_id=chapter.id,
                    type=data["type"],
                    question=data["question"],
                    answer=data["answer"],
                    example=data.get("example"),
                    source="manual",
                    difficulty=data["difficulty"]
                )
                db.add(flashcard)
                print(f"Created flashcard: {data['question'][:50]}...")
            else:
                print(f"Flashcard already exists: {data['question'][:50]}...")
        
        db.commit()
        print("\nFlashcards seeded successfully!")
        
        # Show count
        count = db.query(Flashcard).filter_by(chapter_id=chapter.id).count()
        print(f"Total flashcards for chapter '{chapter.title}': {count}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_flashcards()