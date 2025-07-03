"""
PDF Chapter API endpoints
Handles chapter-based PDF content loading
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from typing import Optional, Dict, List
import logging
from pathlib import Path
import PyPDF2
import io
import fitz  # PyMuPDF pour extraction optimisée

from app.api.auth import get_current_user
from app.models.user import User
from app.services.pdf_service import pdf_service
from app.api.content import get_available_courses
from functools import lru_cache

logger = logging.getLogger(__name__)
router = APIRouter()

# Cache pour stocker les PDFs extraits (max 10 chapitres)
@lru_cache(maxsize=10)
def extract_chapter_cached(pdf_path: str, chapter_id: str, start_page: int, end_page: int, pdf_mtime: float) -> bytes:
    """Extrait et cache un chapitre du PDF - Version optimisée avec PyMuPDF"""
    # PyMuPDF permet la lecture partielle - ne charge que les pages nécessaires
    doc = fitz.open(pdf_path)
    
    # Créer un nouveau document avec seulement les pages du chapitre
    new_doc = fitz.open()  # Nouveau document vide
    
    # Copier seulement les pages nécessaires (PyMuPDF utilise un index 0-based)
    for page_num in range(start_page - 1, end_page):
        if page_num < len(doc):
            # Charge et copie SEULEMENT cette page en mémoire
            new_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
    
    # Convertir en bytes
    pdf_bytes = new_doc.write()
    
    # Fermer les documents pour libérer la mémoire
    doc.close()
    new_doc.close()
    
    return pdf_bytes

# Default chapter structure for mathematics courses
DEFAULT_MATH_CHAPTERS = {
    "ch1": {"start": 17, "end": 42, "title": "Programmation en langage Python"},
    "ch2": {"start": 45, "end": 68, "title": "Nombres et calculs"},
    "ch3": {"start": 71, "end": 94, "title": "Intervalles, inégalités, inéquations"},
    "ch4": {"start": 97, "end": 120, "title": "Calcul littéral"}
}


@router.get("/chapters")
async def get_chapters(
    course_id: str = Query(..., description="Course ID from the courses list"),
    current_user: User = Depends(get_current_user)
):
    """Get available chapters"""
    # Get available courses
    courses = get_available_courses()
    
    # Find the specific course
    course = next((c for c in courses if c["id"] == course_id), None)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # For mathematics courses, return default chapters
    # In a real implementation, this would extract chapters from the actual PDF
    if "mathematiques" in course["matiere"]:
        chapters = DEFAULT_MATH_CHAPTERS
    else:
        # For other subjects, return a generic structure
        chapters = {
            "ch1": {"start": 1, "end": 20, "title": "Introduction"}
        }
    
    return {
        "course": course["title"],
        "chapters": [
            {
                "id": chapter_id,
                "title": info["title"],
                "startPage": info["start"],
                "endPage": info["end"],
                "pageCount": info["end"] - info["start"] + 1
            }
            for chapter_id, info in chapters.items()
        ]
    }


@router.get("/chapter/{chapter_id}")
async def get_chapter_info(
    chapter_id: str,
    course_id: str = Query(..., description="Course ID from the courses list"),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific chapter"""
    # Get available courses
    courses = get_available_courses()
    
    # Find the specific course
    course = next((c for c in courses if c["id"] == course_id), None)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    pdf_path = course["pdf_path"]
    
    # Get chapters for this course
    if "mathematiques" in course["matiere"]:
        chapters = DEFAULT_MATH_CHAPTERS
    else:
        chapters = {"ch1": {"start": 1, "end": 20, "title": "Introduction"}}
    
    if chapter_id not in chapters:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    chapter = chapters[chapter_id]
    
    try:
        # Extract chapter content summary
        pages_text = {}
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Get first few pages of the chapter for preview
            for i in range(chapter["start"] - 1, min(chapter["start"] + 2, chapter["end"])):
                if i < len(pdf_reader.pages):
                    page = pdf_reader.pages[i]
                    text = page.extract_text()
                    pages_text[i + 1] = text[:500]  # First 500 chars
        
        return {
            "id": chapter_id,
            "title": chapter["title"],
            "startPage": chapter["start"],
            "endPage": chapter["end"],
            "pageCount": chapter["end"] - chapter["start"] + 1,
            "preview": pages_text
        }
        
    except Exception as e:
        logger.error(f"Error getting chapter info: {str(e)}")
        raise HTTPException(status_code=500, detail="Error reading chapter")


@router.get("/chapter/{chapter_id}/pdf")
async def get_chapter_pdf(
    chapter_id: str,
    course_id: str = Query(..., description="Course ID from the courses list"),
    current_user: User = Depends(get_current_user)
):
    """Get PDF file for a specific chapter only"""
    # Get available courses
    courses = get_available_courses()
    
    # Find the specific course
    course = next((c for c in courses if c["id"] == course_id), None)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    pdf_path = Path(course["pdf_path"])
    
    # Get chapters for this course
    if "mathematiques" in course["matiere"]:
        chapters = DEFAULT_MATH_CHAPTERS
    else:
        chapters = {"ch1": {"start": 1, "end": 20, "title": "Introduction"}}
    
    if chapter_id not in chapters:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    chapter = chapters[chapter_id]
    
    try:
        # Utiliser le cache pour éviter de recharger le PDF complet
        pdf_mtime = pdf_path.stat().st_mtime
        pdf_data = extract_chapter_cached(str(pdf_path), chapter_id, chapter["start"], chapter["end"], pdf_mtime)
        
        # Créer un BytesIO à partir des données cachées
        pdf_bytes = io.BytesIO(pdf_data)
        pdf_bytes.seek(0)
        
        # Return as streaming response
        return StreamingResponse(
            pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{chapter["title"]}.pdf"',
                "Cache-Control": "public, max-age=3600"
            }
        )
        
    except Exception as e:
        logger.error(f"Error creating chapter PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating chapter PDF")


@router.get("/chapter/{chapter_id}/page/{page_num}")
async def get_chapter_page(
    chapter_id: str,
    page_num: int,
    course_id: str = Query(..., description="Course ID from the courses list"),
    current_user: User = Depends(get_current_user)
):
    """Get a specific page from a chapter"""
    # Get available courses
    courses = get_available_courses()
    
    # Find the specific course
    course = next((c for c in courses if c["id"] == course_id), None)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    pdf_path = course["pdf_path"]
    
    # Get chapters for this course
    if "mathematiques" in course["matiere"]:
        chapters = DEFAULT_MATH_CHAPTERS
    else:
        chapters = {"ch1": {"start": 1, "end": 20, "title": "Introduction"}}
    
    if chapter_id not in chapters:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    chapter = chapters[chapter_id]
    
    # Validate page number is within chapter
    if page_num < chapter["start"] or page_num > chapter["end"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Page {page_num} is not in chapter {chapter_id}"
        )
    
    try:
        # Get page content
        content = pdf_service.get_page_content(pdf_path, page_num)
        
        if not content:
            raise HTTPException(status_code=404, detail=f"Page {page_num} not found")
        
        # Get structured content
        structured = pdf_service.extract_structured_content(pdf_path, page_num)
        
        return {
            "chapter": {
                "id": chapter_id,
                "title": chapter["title"]
            },
            "pageNumber": page_num,
            "relativePageNumber": page_num - chapter["start"] + 1,
            "totalChapterPages": chapter["end"] - chapter["start"] + 1,
            "content": content,
            "structuredContent": structured
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting page content: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving page")


@router.post("/chapter/{chapter_id}/search")
async def search_in_chapter(
    chapter_id: str,
    query: str,
    course_id: str = Query(..., description="Course ID from the courses list"),
    max_results: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Search within a specific chapter"""
    # Get available courses
    courses = get_available_courses()
    
    # Find the specific course
    course = next((c for c in courses if c["id"] == course_id), None)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    pdf_path = course["pdf_path"]
    
    # Get chapters for this course
    if "mathematiques" in course["matiere"]:
        chapters = DEFAULT_MATH_CHAPTERS
    else:
        chapters = {"ch1": {"start": 1, "end": 20, "title": "Introduction"}}
    
    if chapter_id not in chapters:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    chapter = chapters[chapter_id]
    
    try:
        # Search only within chapter pages
        all_results = pdf_service.search_content(pdf_path, query, max_results * 2)
        
        # Filter results to chapter pages only
        chapter_results = [
            result for result in all_results
            if chapter["start"] <= result["page_number"] <= chapter["end"]
        ][:max_results]
        
        return {
            "chapter": {
                "id": chapter_id,
                "title": chapter["title"]
            },
            "query": query,
            "results": chapter_results,
            "totalResults": len(chapter_results)
        }
        
    except Exception as e:
        logger.error(f"Error searching chapter: {str(e)}")
        raise HTTPException(status_code=500, detail="Error searching content")


@router.get("/chapter/{chapter_id}/summary")
async def get_chapter_summary(
    chapter_id: str,
    course_id: str = Query(..., description="Course ID from the courses list"),
    current_user: User = Depends(get_current_user)
):
    """Get AI-generated summary for a chapter"""
    # Get available courses
    courses = get_available_courses()
    
    # Find the specific course
    course = next((c for c in courses if c["id"] == course_id), None)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get chapters for this course
    if "mathematiques" in course["matiere"]:
        chapters = DEFAULT_MATH_CHAPTERS
    else:
        chapters = {"ch1": {"start": 1, "end": 20, "title": "Introduction"}}
    
    if chapter_id not in chapters:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # For now, return pre-defined summaries
    # In production, this would call the LLM service
    summaries = {
        "ch1": {
            "title": "Programmation en langage Python",
            "overview": "Ce chapitre introduit les concepts fondamentaux de la programmation en Python, incluant les types de variables, les structures de contrôle et les fonctions.",
            "keyPoints": [
                "Types de variables et affectation",
                "Instructions conditionnelles (if/else)",
                "Définition et utilisation de fonctions",
                "Boucles for et while",
                "Résolution de problèmes algorithmiques"
            ],
            "objectives": [
                "Comprendre les types de données en Python",
                "Maîtriser les structures de contrôle",
                "Créer et utiliser des fonctions",
                "Résoudre des problèmes avec des algorithmes"
            ]
        },
        "ch2": {
            "title": "Nombres et calculs",
            "overview": "Exploration approfondie des concepts mathématiques fondamentaux incluant les puissances, racines carrées et nombres premiers.",
            "keyPoints": [
                "Puissances entières et leurs propriétés",
                "Racine carrée et calculs associés",
                "Nombres premiers et divisibilité",
                "Ensembles de nombres (N, Z, Q, R)"
            ],
            "objectives": [
                "Maîtriser les calculs avec puissances",
                "Comprendre les propriétés des racines",
                "Identifier et utiliser les nombres premiers",
                "Naviguer entre les ensembles de nombres"
            ]
        }
    }
    
    return summaries.get(chapter_id, {
        "title": chapters[chapter_id]["title"],
        "overview": "Résumé à venir...",
        "keyPoints": [],
        "objectives": []
    })