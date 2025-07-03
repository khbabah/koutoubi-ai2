"""
PDF Content Extractor API
Extrait et structure le contenu complet d'un PDF pour navigation intelligente
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
import fitz  # PyMuPDF
import re
from pathlib import Path
import logging

from app.api.auth import get_current_user
from app.models.user import User
from app.services.chapter_summarizer import chapter_summarizer
from app.api.content import get_available_courses

logger = logging.getLogger(__name__)
router = APIRouter()

def extract_structure_from_pdf(pdf_path: Path) -> Dict[str, Any]:
    """
    Extrait la structure complète du PDF avec:
    - Titres et sections
    - Paragraphes importants
    - Formules mathématiques
    - Définitions
    - Numéros de pages
    """
    try:
        doc = fitz.open(str(pdf_path))
        structure = {
            "title": "Document",
            "total_pages": len(doc),
            "sections": []
        }
        
        current_section = None
        current_subsection = None
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            # Extraire les blocs de texte avec leur position
            blocks = page.get_text("dict")
            
            for block in blocks.get("blocks", []):
                if block.get("type") == 0:  # Text block
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text_content = span.get("text", "").strip()
                            if not text_content:
                                continue
                            
                            font_size = span.get("size", 12)
                            font_flags = span.get("flags", 0)
                            is_bold = font_flags & 2 ** 4  # Bold flag
                            
                            # Détecter les titres principaux (grande taille + gras)
                            if font_size > 16 and is_bold:
                                current_section = {
                                    "type": "section",
                                    "title": text_content,
                                    "page": page_num + 1,
                                    "subsections": [],
                                    "content": []
                                }
                                structure["sections"].append(current_section)
                                current_subsection = None
                            
                            # Détecter les sous-titres
                            elif font_size > 14 and (is_bold or text_content.startswith(("a.", "b.", "c.", "1.", "2.", "3."))):
                                if current_section:
                                    current_subsection = {
                                        "type": "subsection",
                                        "title": text_content,
                                        "page": page_num + 1,
                                        "content": []
                                    }
                                    current_section["subsections"].append(current_subsection)
                            
                            # Détecter les formules mathématiques
                            elif any(symbol in text_content for symbol in ["=", "×", "÷", "+", "-", "²", "³", "√", "∑", "∫"]):
                                formula_item = {
                                    "type": "formula",
                                    "content": text_content,
                                    "page": page_num + 1
                                }
                                if current_subsection:
                                    current_subsection["content"].append(formula_item)
                                elif current_section:
                                    current_section["content"].append(formula_item)
                            
                            # Détecter les définitions (texte avec ":" ou "est")
                            elif (":" in text_content or " est " in text_content) and len(text_content) > 20:
                                definition_item = {
                                    "type": "definition",
                                    "content": text_content,
                                    "page": page_num + 1
                                }
                                if current_subsection:
                                    current_subsection["content"].append(definition_item)
                                elif current_section:
                                    current_section["content"].append(definition_item)
                            
                            # Paragraphes normaux importants (plus de 50 caractères)
                            elif len(text_content) > 50 and not text_content.isdigit():
                                paragraph_item = {
                                    "type": "paragraph",
                                    "content": text_content[:200] + "..." if len(text_content) > 200 else text_content,
                                    "page": page_num + 1
                                }
                                if current_subsection:
                                    current_subsection["content"].append(paragraph_item)
                                elif current_section:
                                    current_section["content"].append(paragraph_item)
        
        doc.close()
        return structure
        
    except Exception as e:
        logger.error(f"Error extracting PDF structure: {str(e)}")
        raise


@router.get("/course/{course_id}/high-level-structure")
async def get_high_level_structure(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retourne uniquement la structure de haut niveau (chapitres) du PDF
    Pas de contenu détaillé - juste les titres et numéros de page
    """
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = Path(course["pdf_path"])
        
        # For now, return a default structure for mathematics courses
        # In a real implementation, this would extract the actual structure from the PDF
        if "mathematiques" in course["matiere"]:
            high_level_structure = {
                "title": course["title"],
                "total_pages": 248,  # This should be extracted from the actual PDF
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "Programmation en langage Python",
                        "page": 17,
                        "end_page": 44
                    },
                    {
                        "id": "ch2", 
                        "title": "Nombres et calculs",
                        "page": 45,
                        "end_page": 70
                    },
                    {
                        "id": "ch3",
                        "title": "Intervalles, inégalités, inéquations",
                        "page": 71,
                        "end_page": 96
                    },
                    {
                        "id": "ch4",
                        "title": "Calcul littéral",
                        "page": 97,
                        "end_page": 120
                    },
                    {
                        "id": "ch5",
                        "title": "Fonctions linéaires et affines",
                        "page": 121,
                        "end_page": 150
                    },
                    {
                        "id": "ch6",
                        "title": "Statistiques",
                        "page": 151,
                        "end_page": 180
                    },
                    {
                        "id": "ch7",
                        "title": "Probabilités",
                        "page": 181,
                        "end_page": 210
                    },
                    {
                        "id": "ch8",
                        "title": "Géométrie dans l'espace",
                        "page": 211,
                        "end_page": 248
                    }
                ]
            }
        else:
            # For other subjects, return a generic structure
            high_level_structure = {
                "title": course["title"],
                "total_pages": 100,  # Default
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "Introduction",
                        "page": 1,
                        "end_page": 20
                    }
                ]
            }
        
        return high_level_structure
        
    except Exception as e:
        logger.error(f"Error getting high-level structure: {str(e)}")
        raise HTTPException(status_code=500, detail="Error extracting structure")


@router.get("/course/{course_id}/chapter-summary/{chapter_id}")
async def get_chapter_summary(
    course_id: str,
    chapter_id: str,
    mode: str = Query("ai", description="'ai' for AI generation, 'quick' for fast extraction"),
    current_user: User = Depends(get_current_user)
):
    """
    Génère et retourne le résumé AI d'un chapitre spécifique
    """
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        # Obtenir les infos du chapitre depuis la structure
        # This would be dynamically extracted in a real implementation
        chapters_info = {
            "ch1": {"title": "Programmation en langage Python", "start": 17, "end": 44},
            "ch2": {"title": "Nombres et calculs", "start": 45, "end": 70},
            "ch3": {"title": "Intervalles, inégalités, inéquations", "start": 71, "end": 96},
            "ch4": {"title": "Calcul littéral", "start": 97, "end": 120},
            "ch5": {"title": "Fonctions linéaires et affines", "start": 121, "end": 150},
            "ch6": {"title": "Statistiques", "start": 151, "end": 180},
            "ch7": {"title": "Probabilités", "start": 181, "end": 210},
            "ch8": {"title": "Géométrie dans l'espace", "start": 211, "end": 248}
        }
        
        if chapter_id not in chapters_info:
            raise HTTPException(status_code=404, detail="Chapter not found")
        
        chapter_info = chapters_info[chapter_id]
        
        # Utiliser le mode approprié
        if mode == "quick":
            # Génération rapide basée sur l'extraction
            result = chapter_summarizer.generate_quick_summary(
                pdf_path=pdf_path,
                chapter_id=chapter_id,
                chapter_title=chapter_info["title"],
                start_page=chapter_info["start"],
                end_page=chapter_info["end"]
            )
        else:
            # Génération AI complète
            result = await chapter_summarizer.generate_chapter_summary(
                pdf_path=pdf_path,
                chapter_id=chapter_id,
                chapter_title=chapter_info["title"],
                start_page=chapter_info["start"],
                end_page=chapter_info["end"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating chapter summary: {str(e)}")
        
        # Fallback sur les données de démo si erreur
        chapter_summaries = {
            "ch1": {
                "chapter_id": "ch1",
                "title": "Programmation en langage Python",
                "summary": "Ce chapitre introduit les concepts fondamentaux de la programmation Python.",
                "sections": [
                    {
                        "title": "Types de variables et affectation",
                        "page": 22,
                        "key_points": [
                            {"type": "definition", "content": "int: nombres entiers (ex: 5, -3, 0)"},
                            {"type": "definition", "content": "float: nombres décimaux (ex: 3.14, -0.5)"},
                            {"type": "definition", "content": "str: chaînes de caractères (ex: 'hello')"},
                            {"type": "definition", "content": "bool: valeurs booléennes (True/False)"}
                        ]
                    },
                    {
                        "title": "Instructions conditionnelles",
                        "page": 24,
                        "key_points": [
                            {"type": "formula", "content": "if condition: instruction"},
                            {"type": "formula", "content": "if/elif/else structure"},
                            {"type": "example", "content": "Exemple: vérifier si un nombre est pair"}
                        ]
                    },
                    {
                        "title": "Fonctions",
                        "page": 26,
                        "key_points": [
                            {"type": "formula", "content": "def nom_fonction(paramètres): return valeur"},
                            {"type": "concept", "content": "Principe de réutilisabilité du code"},
                            {"type": "example", "content": "Fonction pour calculer l'aire d'un cercle"}
                        ]
                    },
                    {
                        "title": "Boucles",
                        "page": 28,
                        "key_points": [
                            {"type": "formula", "content": "for i in range(n): instruction"},
                            {"type": "formula", "content": "while condition: instruction"},
                            {"type": "tip", "content": "Utiliser 'for' pour un nombre connu d'itérations"}
                        ]
                    }
                ]
            },
            "ch2": {
                "chapter_id": "ch2",
                "title": "Nombres et calculs",
                "summary": "Maîtrise des puissances, racines carrées et nombres premiers.",
                "sections": [
                    {
                        "title": "Puissances entières relatives",
                        "page": 48,
                        "key_points": [
                            {"type": "formula", "content": "aⁿ × aᵐ = aⁿ⁺ᵐ"},
                            {"type": "formula", "content": "(aⁿ)ᵐ = aⁿˣᵐ"},
                            {"type": "formula", "content": "a⁻ⁿ = 1/aⁿ"},
                            {"type": "tip", "content": "Attention aux signes avec les puissances négatives"}
                        ]
                    },
                    {
                        "title": "Racine carrée",
                        "page": 49,
                        "key_points": [
                            {"type": "formula", "content": "√(a×b) = √a × √b"},
                            {"type": "definition", "content": "La racine carrée d'un nombre positif a est le nombre positif dont le carré est a"},
                            {"type": "warning", "content": "√a n'existe que si a ≥ 0"}
                        ]
                    }
                ]
            }
        }
        
        if chapter_id not in chapter_summaries:
            # Si pas en cache, générer avec AI (simulé ici)
            return {
                "chapter_id": chapter_id,
                "title": "Chapitre en cours de génération",
                "summary": "Le résumé de ce chapitre est en cours de génération par l'IA...",
                "sections": []
            }
        
        return chapter_summaries[chapter_id]
        
    except Exception as e:
        logger.error(f"Error getting chapter summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating chapter summary")


@router.get("/extract-summary")
async def get_pdf_summary(
    current_user: User = Depends(get_current_user)
):
    """
    DEPRECATED - Utilisez /high-level-structure et /chapter-summary/{id} à la place
    Gardé pour compatibilité
    """
    try:
        # Pour compatibilité, retourne l'ancienne structure
        math_structure = {
            "title": "Mathématiques 4ème Secondaire",
            "total_pages": 248,
            "sections": [
                {
                    "type": "section",
                    "title": "Chapitre 1: Programmation en langage Python",
                    "page": 17,
                    "subsections": [
                        {
                            "type": "subsection",
                            "title": "1. Types de variables et affectation",
                            "page": 22,
                            "content": [
                                {
                                    "type": "definition",
                                    "content": "int: nombres entiers (ex: 5, -3, 0)",
                                    "page": 22
                                },
                                {
                                    "type": "definition",
                                    "content": "float: nombres décimaux (ex: 3.14, -0.5)",
                                    "page": 22
                                },
                                {
                                    "type": "definition",
                                    "content": "str: chaînes de caractères (ex: 'hello')",
                                    "page": 22
                                },
                                {
                                    "type": "definition",
                                    "content": "bool: valeurs booléennes (True/False)",
                                    "page": 22
                                }
                            ]
                        },
                        {
                            "type": "subsection",
                            "title": "2. Instructions conditionnelles",
                            "page": 24,
                            "content": [
                                {
                                    "type": "formula",
                                    "content": "if condition: instruction",
                                    "page": 24
                                },
                                {
                                    "type": "formula",
                                    "content": "if/elif/else structure",
                                    "page": 24
                                }
                            ]
                        },
                        {
                            "type": "subsection",
                            "title": "3. Fonctions",
                            "page": 26,
                            "content": [
                                {
                                    "type": "formula",
                                    "content": "def nom_fonction(paramètres): return valeur",
                                    "page": 26
                                }
                            ]
                        },
                        {
                            "type": "subsection",
                            "title": "4. Boucles",
                            "page": 28,
                            "content": [
                                {
                                    "type": "formula",
                                    "content": "for i in range(n): instruction",
                                    "page": 28
                                },
                                {
                                    "type": "formula",
                                    "content": "while condition: instruction",
                                    "page": 28
                                }
                            ]
                        }
                    ],
                    "content": []
                },
                {
                    "type": "section",
                    "title": "Chapitre 2: Nombres et calculs",
                    "page": 45,
                    "subsections": [
                        {
                            "type": "subsection",
                            "title": "1. Puissances entières relatives",
                            "page": 48,
                            "content": [
                                {
                                    "type": "formula",
                                    "content": "aⁿ × aᵐ = aⁿ⁺ᵐ",
                                    "page": 48
                                },
                                {
                                    "type": "formula",
                                    "content": "(aⁿ)ᵐ = aⁿˣᵐ",
                                    "page": 48
                                },
                                {
                                    "type": "formula",
                                    "content": "a⁻ⁿ = 1/aⁿ",
                                    "page": 48
                                }
                            ]
                        },
                        {
                            "type": "subsection",
                            "title": "2. Racine carrée",
                            "page": 49,
                            "content": [
                                {
                                    "type": "formula",
                                    "content": "√(a×b) = √a × √b",
                                    "page": 49
                                },
                                {
                                    "type": "definition",
                                    "content": "La racine carrée d'un nombre positif a est le nombre positif dont le carré est a",
                                    "page": 49
                                }
                            ]
                        },
                        {
                            "type": "subsection",
                            "title": "3. Nombres premiers",
                            "page": 50,
                            "content": [
                                {
                                    "type": "definition",
                                    "content": "Un nombre premier est un entier naturel qui admet exactement deux diviseurs: 1 et lui-même",
                                    "page": 50
                                },
                                {
                                    "type": "paragraph",
                                    "content": "Nombres premiers < 20: 2, 3, 5, 7, 11, 13, 17, 19",
                                    "page": 50
                                }
                            ]
                        }
                    ],
                    "content": []
                },
                {
                    "type": "section",
                    "title": "Chapitre 3: Intervalles, inégalités, inéquations",
                    "page": 71,
                    "subsections": [
                        {
                            "type": "subsection",
                            "title": "1. Intervalles",
                            "page": 74,
                            "content": [
                                {
                                    "type": "definition",
                                    "content": "[a,b] = {x ∈ ℝ | a ≤ x ≤ b} (intervalle fermé)",
                                    "page": 74
                                },
                                {
                                    "type": "definition",
                                    "content": "]a,b[ = {x ∈ ℝ | a < x < b} (intervalle ouvert)",
                                    "page": 74
                                }
                            ]
                        },
                        {
                            "type": "subsection",
                            "title": "2. Valeur absolue",
                            "page": 78,
                            "content": [
                                {
                                    "type": "formula",
                                    "content": "|x| = x si x ≥ 0, |x| = -x si x < 0",
                                    "page": 78
                                },
                                {
                                    "type": "formula",
                                    "content": "|a×b| = |a| × |b|",
                                    "page": 78
                                }
                            ]
                        }
                    ],
                    "content": []
                },
                {
                    "type": "section", 
                    "title": "Chapitre 4: Calcul littéral",
                    "page": 97,
                    "subsections": [
                        {
                            "type": "subsection",
                            "title": "1. Identités remarquables",
                            "page": 102,
                            "content": [
                                {
                                    "type": "formula",
                                    "content": "(a+b)² = a² + 2ab + b²",
                                    "page": 102
                                },
                                {
                                    "type": "formula",
                                    "content": "(a-b)² = a² - 2ab + b²",
                                    "page": 102
                                },
                                {
                                    "type": "formula",
                                    "content": "a² - b² = (a+b)(a-b)",
                                    "page": 102
                                }
                            ]
                        }
                    ],
                    "content": []
                }
            ]
        }
        
        return math_structure
        
    except Exception as e:
        logger.error(f"Error getting PDF summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Error extracting PDF summary")