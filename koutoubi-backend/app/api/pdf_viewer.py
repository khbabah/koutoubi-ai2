"""
PDF Viewer API
Serves PDF files directly for viewing
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.api.auth import get_current_user, get_user_by_username, get_user_by_email
from app.core.security import verify_token
from app.core.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/pdf-viewer", tags=["pdf-viewer"])


@router.get("/{niveau}/{annee}/{matiere}")
async def get_pdf_file(
    niveau: str,
    annee: str,
    matiere: str,
    token: Optional[str] = Query(None, description="Authentication token")
):
    """Serve PDF file for direct viewing"""
    try:
        # Get database session
        db = next(get_db())
        
        # Authenticate via token if provided
        if token:
            username = verify_token(token)
            if not username:
                logger.error("Token verification failed: invalid token")
                raise HTTPException(status_code=401, detail="Invalid authentication token")
            
            # Get user from database
            current_user = get_user_by_email(db, username) or get_user_by_username(db, username)
            if not current_user:
                raise HTTPException(status_code=401, detail="User not found")
        else:
            # Check if user is authenticated - this won't work in iframe
            raise HTTPException(status_code=401, detail="Authentication token required")
        
        # Construct PDF path
        from app.api.content import get_available_courses
        courses = get_available_courses()
        
        # Find the course
        course = next(
            (c for c in courses 
             if c["niveau"] == niveau and c["annee"] == annee and c["matiere"] == matiere),
            None
        )
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = Path(course["pdf_path"])
        
        if not pdf_path.exists():
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        # Return PDF file
        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=f"{matiere}_{annee}_{niveau}.pdf",
            headers={
                "Content-Disposition": "inline",  # Display in browser
                "Cache-Control": "public, max-age=3600"  # Cache for 1 hour
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Error serving PDF file")


@router.get("/{niveau}/{annee}/{matiere}/page/{page_num}")
async def get_pdf_page(
    niveau: str,
    annee: str,
    matiere: str,
    page_num: int,
    token: Optional[str] = Query(None, description="Authentication token")
):
    """Get a specific page from PDF as image"""
    try:
        # This would require pdf2image or similar library
        # For now, we'll return a message
        return {
            "message": "Page rendering not yet implemented",
            "page": page_num,
            "use_full_pdf": f"/api/v1/pdf-viewer/{niveau}/{annee}/{matiere}"
        }
    except Exception as e:
        logger.error(f"Error getting PDF page: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting PDF page")