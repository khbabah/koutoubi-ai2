"""
Version optimisée qui ne charge que les pages nécessaires
"""
import fitz  # PyMuPDF - plus efficace pour la lecture partielle
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
import io
from pathlib import Path
import logging

from app.api.auth import get_current_user
from app.models.user import User
from app.api.content import get_available_courses

logger = logging.getLogger(__name__)
router = APIRouter()

# Default chapter structure for mathematics courses
DEFAULT_MATH_CHAPTERS = {
    "ch1": {"start": 17, "end": 42, "title": "Programmation en langage Python"},
    "ch2": {"start": 45, "end": 68, "title": "Nombres et calculs"},
    "ch3": {"start": 71, "end": 94, "title": "Intervalles, inégalités, inéquations"},
    "ch4": {"start": 97, "end": 120, "title": "Calcul littéral"}
}


@router.get("/chapter/{chapter_id}/pdf-optimized")
async def get_chapter_pdf_optimized(
    chapter_id: str,
    course_id: str = Query(..., description="Course ID from the courses list"),
    current_user: User = Depends(get_current_user)
):
    """Version optimisée qui ne charge que les pages nécessaires"""
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
        # PyMuPDF permet la lecture partielle
        doc = fitz.open(pdf_path)
        
        # Créer un nouveau document avec seulement les pages du chapitre
        new_doc = fitz.open()  # Nouveau document vide
        
        # Copier seulement les pages nécessaires
        # PyMuPDF utilise un index 0-based
        for page_num in range(chapter["start"] - 1, chapter["end"]):
            if page_num < len(doc):
                # Charge et copie SEULEMENT cette page
                page = doc.load_page(page_num)
                new_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
        
        # Convertir en bytes
        pdf_bytes = new_doc.write()
        
        # Fermer les documents
        doc.close()
        new_doc.close()
        
        # Retourner le PDF
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{chapter["title"]}.pdf"',
                "Cache-Control": "public, max-age=3600"
            }
        )
        
    except Exception as e:
        logger.error(f"Error creating chapter PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating chapter PDF")


# Alternative avec pikepdf (encore plus efficace)
import pikepdf

@router.get("/chapter/{chapter_id}/pdf-pikepdf")
async def get_chapter_pdf_pikepdf(
    chapter_id: str,
    course_id: str = Query(..., description="Course ID from the courses list"),
    current_user: User = Depends(get_current_user)
):
    """Version avec pikepdf - très efficace en mémoire"""
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
        # Ouvrir le PDF source
        with pikepdf.open(pdf_path) as pdf:
            # Créer un nouveau PDF
            new_pdf = pikepdf.new()
            
            # Copier seulement les pages nécessaires
            # pikepdf utilise un index 0-based
            for page_num in range(chapter["start"] - 1, chapter["end"]):
                if page_num < len(pdf.pages):
                    # Copie seulement la référence, pas le contenu complet
                    new_pdf.pages.append(pdf.pages[page_num])
            
            # Sauvegarder en mémoire
            output = io.BytesIO()
            new_pdf.save(output)
            output.seek(0)
            
            return StreamingResponse(
                output,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'inline; filename="{chapter["title"]}.pdf"',
                    "Cache-Control": "public, max-age=3600"
                }
            )
            
    except Exception as e:
        logger.error(f"Error creating chapter PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating chapter PDF")


# Solution avec cache pour éviter de recalculer
from functools import lru_cache
import hashlib

@lru_cache(maxsize=10)
def get_chapter_pdf_cached(pdf_path: str, chapter_id: str, start_page: int, end_page: int, pdf_mtime: float):
    """Cache le PDF extrait en mémoire"""
    # L'extraction se fait une seule fois par chapitre
    # pdf_mtime permet d'invalider le cache si le fichier change
    
    with pikepdf.open(pdf_path) as pdf:
        new_pdf = pikepdf.new()
        
        for page_num in range(start_page - 1, end_page):
            if page_num < len(pdf.pages):
                new_pdf.pages.append(pdf.pages[page_num])
        
        output = io.BytesIO()
        new_pdf.save(output)
        return output.getvalue()


@router.get("/chapter/{chapter_id}/pdf-cached")
async def get_chapter_pdf_with_cache(
    chapter_id: str,
    course_id: str = Query(..., description="Course ID from the courses list"),
    current_user: User = Depends(get_current_user)
):
    """Version avec cache - très rapide après la première requête"""
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
        # Obtenir le timestamp de modification du fichier
        pdf_mtime = pdf_path.stat().st_mtime
        
        # Récupérer depuis le cache ou générer
        pdf_bytes = get_chapter_pdf_cached(str(pdf_path), chapter_id, chapter["start"], chapter["end"], pdf_mtime)
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{chapter["title"]}.pdf"',
                "Cache-Control": "public, max-age=3600"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting cached PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting PDF")