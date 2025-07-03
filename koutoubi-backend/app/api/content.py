"""
Content API endpoints
Handles course listings and content structure
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import logging
from pathlib import Path
import os

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.services.pdf_service import pdf_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Base path for content
CONTENT_BASE_PATH = Path("/Users/khaled/Khaled_ALL/INFO_PROJECTS/GitHub-Khbabah/koutoubi-ai2/content")
PDF_BASE_PATH = CONTENT_BASE_PATH / "pdf"


def get_available_courses() -> List[Dict]:
    """Get all available courses from PDF directory"""
    courses = []
    course_id = 1
    
    # Mapping des noms pour l'affichage
    niveau_names = {
        "secondaire1": "Secondaire 1er cycle",
        "secondaire2": "Secondaire 2ème cycle"
    }
    
    annee_names = {
        "1ere": "1ère année",
        "2eme": "2ème année",
        "3eme": "3ème année",
        "4eme": "4ème année",
        "5eme": "5ème année",
        "6eme": "6ème année",
        "7eme": "7ème année (Bac)"
    }
    
    matiere_names = {
        "anglais": "Anglais",
        "arabe": "Arabe",
        "education-civique": "Éducation Civique",
        "education-islamique": "Éducation Islamique",
        "francais": "Français",
        "geographie": "Géographie",
        "histoire": "Histoire",
        "mathematiques": "Mathématiques",
        "physique": "Physique",
        "chimie": "Chimie",
        "sciences": "Sciences",
        "philosophie": "Philosophie"
    }
    
    # Parcourir la structure des PDFs
    if not PDF_BASE_PATH.exists():
        logger.warning(f"PDF base path does not exist: {PDF_BASE_PATH}")
        return courses
        
    for niveau_dir in sorted(PDF_BASE_PATH.iterdir()):
        if not niveau_dir.is_dir():
            continue
            
        niveau = niveau_dir.name
        niveau_display = niveau_names.get(niveau, niveau)
        
        for annee_dir in sorted(niveau_dir.iterdir()):
            if not annee_dir.is_dir():
                continue
                
            annee = annee_dir.name
            annee_display = annee_names.get(annee, annee)
            
            for pdf_file in sorted(annee_dir.glob("*.pdf")):
                # Skip NEW versions and alternatives for now
                if "_NEW" in pdf_file.name or "-alt" in pdf_file.name:
                    continue
                
                matiere = pdf_file.stem
                
                # Handle variants (7eme with -c, -d, -l, -a)
                variant = ""
                if "-" in matiere and annee == "7eme":
                    base_matiere, variant = matiere.rsplit("-", 1)
                    variant_names = {
                        "c": "Sciences Expérimentales",
                        "d": "Mathématiques",
                        "l": "Lettres",
                        "a": "Arts"
                    }
                    variant_display = variant_names.get(variant.lower(), variant.upper())
                    matiere_display = f"{matiere_names.get(base_matiere, base_matiere)} ({variant_display})"
                else:
                    matiere_display = matiere_names.get(matiere, matiere.title())
                
                # Create course entry
                course = {
                    "id": str(course_id),
                    "niveau": niveau,
                    "niveau_name": niveau_display,
                    "annee": annee,
                    "annee_name": annee_display,
                    "matiere": matiere,
                    "matiere_name": matiere_display,
                    "title": f"{matiere_display} - {annee_display} {niveau_display}",
                    "pdf_path": str(pdf_file),
                    "relative_path": str(pdf_file.relative_to(PDF_BASE_PATH)),
                    "file_size_mb": round(pdf_file.stat().st_size / (1024 * 1024), 2),
                    "available": True,
                    "variant": variant.upper() if variant else None
                }
                courses.append(course)
                course_id += 1
    
    # Sort by level, year, and subject
    courses.sort(key=lambda x: (
        x["niveau"],
        int(x["annee"][0]) if x["annee"][0].isdigit() else 99,
        x["matiere"]
    ))
    
    logger.info(f"Found {len(courses)} courses in PDF directory")
    return courses


@router.get("/courses")
async def get_courses(
    niveau: Optional[str] = None,
    annee: Optional[str] = None,
    matiere: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get available courses with optional filtering"""
    try:
        courses = get_available_courses()
        
        # Apply filters if provided
        if niveau:
            courses = [c for c in courses if c["niveau"] == niveau]
        if annee:
            courses = [c for c in courses if c["annee"] == annee]
        if matiere:
            courses = [c for c in courses if c["matiere"] == matiere]
        
        # Sort by level, grade, and subject
        courses.sort(key=lambda x: (x["niveau"], x["annee"], x["matiere"]))
        
        return {
            "total": len(courses),
            "courses": courses
        }
        
    except Exception as e:
        logger.error(f"Error getting courses: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving courses")


@router.get("/course/{niveau}/{annee}/{matiere}")
async def get_course_info(
    niveau: str,
    annee: str,
    matiere: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific course"""
    try:
        courses = get_available_courses()
        
        # Find the specific course
        course = next(
            (c for c in courses 
             if c["niveau"] == niveau and c["annee"] == annee and c["matiere"] == matiere),
            None
        )
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Add additional information if needed
        pdf_path = Path(course["pdf_path"])
        if pdf_path.exists():
            try:
                # Extract PDF info
                import PyPDF2
                with open(pdf_path, 'rb') as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    course["total_pages"] = len(pdf_reader.pages)
                    course["chapters"] = []  # Placeholder for chapter extraction
            except Exception as e:
                logger.warning(f"Could not extract PDF info: {str(e)}")
                course["total_pages"] = 0
                course["chapters"] = []
        
        return course
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting course info: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving course information")


@router.get("/levels")
async def get_levels(
    current_user: User = Depends(get_current_user)
):
    """Get available education levels"""
    return {
        "levels": [
            {
                "key": "fondamental",
                "name": "Fondamental",
                "grades": ["1ere", "2eme", "3eme", "4eme", "5eme", "6eme"]
            },
            {
                "key": "secondaire1",
                "name": "Secondaire 1er cycle",
                "grades": ["1ere", "2eme", "3eme"]
            },
            {
                "key": "secondaire2",
                "name": "Secondaire 2ème cycle",
                "grades": ["4eme", "5eme", "6eme", "7eme"]
            }
        ]
    }


@router.get("/subjects")
async def get_subjects(
    niveau: Optional[str] = None,
    annee: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get available subjects, optionally filtered by level and grade"""
    try:
        courses = get_available_courses()
        
        # Apply filters
        if niveau:
            courses = [c for c in courses if c["niveau"] == niveau]
        if annee:
            courses = [c for c in courses if c["annee"] == annee]
        
        # Extract unique subjects
        subjects = {}
        for course in courses:
            if course["matiere"] not in subjects:
                subjects[course["matiere"]] = {
                    "key": course["matiere"],
                    "name": course["matiere_name"],
                    "course_count": 0
                }
            subjects[course["matiere"]]["course_count"] += 1
        
        return {
            "subjects": list(subjects.values())
        }
        
    except Exception as e:
        logger.error(f"Error getting subjects: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving subjects")


@router.get("/{niveau}/{annee}/{matiere}/page/{page_num}")
async def get_course_page(
    niveau: str,
    annee: str,
    matiere: str,
    page_num: int,
    current_user: User = Depends(get_current_user)
):
    """Get a specific page from a course PDF"""
    try:
        # Find the course
        courses = get_available_courses()
        course = next(
            (c for c in courses 
             if c["niveau"] == niveau and c["annee"] == annee and c["matiere"] == matiere),
            None
        )
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get page content
        pdf_path = course["pdf_path"]
        content = pdf_service.get_page_content(pdf_path, page_num)
        
        if not content:
            raise HTTPException(status_code=404, detail=f"Page {page_num} not found")
        
        # Get structured content
        structured = pdf_service.extract_structured_content(pdf_path, page_num)
        
        return {
            "course": {
                "niveau": niveau,
                "annee": annee,
                "matiere": matiere,
                "title": course["title"]
            },
            "page_number": page_num,
            "content": content,
            "structured_content": structured,
            "word_count": len(content.split())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting page content: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving page content")


@router.get("/{niveau}/{annee}/{matiere}/info")
async def get_course_pdf_info(
    niveau: str,
    annee: str,
    matiere: str,
    current_user: User = Depends(get_current_user)
):
    """Get PDF information for a specific course"""
    try:
        # Find the course
        courses = get_available_courses()
        course = next(
            (c for c in courses 
             if c["niveau"] == niveau and c["annee"] == annee and c["matiere"] == matiere),
            None
        )
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        if not Path(pdf_path).exists():
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        # Extract basic info
        pages = pdf_service.extract_text_from_pdf(pdf_path)
        
        return {
            "course": course,
            "pdf_info": {
                "filename": Path(pdf_path).name,
                "total_pages": len(pages),
                "available_pages": list(pages.keys())[:20],  # First 20 pages
                "file_size_mb": course["file_size_mb"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting PDF info: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing PDF")


@router.post("/{niveau}/{annee}/{matiere}/search")
async def search_course_content(
    niveau: str,
    annee: str,
    matiere: str,
    query: str = Body(..., embed=True),
    max_results: int = Body(10, embed=True),
    current_user: User = Depends(get_current_user)
):
    """Search for content within a specific course PDF"""
    try:
        # Find the course
        courses = get_available_courses()
        course = next(
            (c for c in courses 
             if c["niveau"] == niveau and c["annee"] == annee and c["matiere"] == matiere),
            None
        )
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Search the PDF
        pdf_path = course["pdf_path"]
        results = pdf_service.search_content(pdf_path, query, max_results)
        
        return {
            "course": {
                "niveau": niveau,
                "annee": annee,
                "matiere": matiere,
                "title": course["title"]
            },
            "query": query,
            "results": results,
            "total_results": len(results)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching course: {str(e)}")
        raise HTTPException(status_code=500, detail="Error searching content")