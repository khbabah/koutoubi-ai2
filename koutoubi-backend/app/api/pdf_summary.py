"""
PDF Summary API endpoints
Handles page-by-page summary generation with copy functionality
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
import logging
import json
from datetime import datetime
from pathlib import Path

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.services.pdf_service import pdf_service
from app.services.llm_service import llm_service
from app.schemas.pdf_summary import (
    PageSummaryRequest,
    PageSummaryResponse,
    DocumentSummaryRequest,
    DocumentSummaryResponse,
    SummaryPage
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Import function to get available courses
from app.api.content import get_available_courses

# Cache for summaries (in production, use Redis)
summary_cache = {}


@router.post("/course/{course_id}/page", response_model=PageSummaryResponse)
async def generate_page_summary(
    course_id: str,
    request: PageSummaryRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate a summary for a specific page"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        # Check cache first
        cache_key = f"{pdf_path}:page:{request.page_number}"
        if cache_key in summary_cache and not request.force_refresh:
            logger.info(f"Returning cached summary for page {request.page_number}")
            return summary_cache[cache_key]
        
        # Get page content
        content = pdf_service.get_page_content(pdf_path, request.page_number)
        if not content:
            raise HTTPException(status_code=404, detail=f"Page {request.page_number} not found")
        
        # Generate summary
        summary_data = await llm_service.generate_page_summary(content, request.page_number)
        
        # Create response
        response = PageSummaryResponse(
            page_number=request.page_number,
            summary=summary_data['summary'],
            keywords=summary_data['keywords'],
            word_count=summary_data['word_count'],
            is_complete=summary_data['is_complete'],
            generated_at=datetime.now()
        )
        
        # Cache the response
        summary_cache[cache_key] = response
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating page summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating summary")


@router.post("/course/{course_id}/document", response_model=DocumentSummaryResponse)
async def generate_document_summary(
    course_id: str,
    request: DocumentSummaryRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Generate summaries for multiple pages"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        # Validate pages exist
        all_pages = pdf_service.extract_text_from_pdf(pdf_path)
        available_pages = list(all_pages.keys())
        
        # Determine which pages to summarize
        if request.page_numbers:
            pages_to_summarize = [p for p in request.page_numbers if p in available_pages]
        else:
            # Default to first N pages
            pages_to_summarize = available_pages[:request.max_pages]
        
        if not pages_to_summarize:
            raise HTTPException(status_code=400, detail="No valid pages to summarize")
        
        # Generate summaries for each page
        page_summaries = []
        
        for page_num in pages_to_summarize:
            try:
                # Check cache
                cache_key = f"{pdf_path}:page:{page_num}"
                
                if cache_key in summary_cache and not request.force_refresh:
                    cached = summary_cache[cache_key]
                    page_summaries.append(SummaryPage(
                        page_number=cached.page_number,
                        summary=cached.summary,
                        keywords=cached.keywords,
                        word_count=cached.word_count,
                        is_complete=cached.is_complete
                    ))
                else:
                    # Generate new summary
                    content = all_pages[page_num]
                    summary_data = await llm_service.generate_page_summary(content, page_num)
                    
                    page_summary = SummaryPage(
                        page_number=page_num,
                        summary=summary_data['summary'],
                        keywords=summary_data['keywords'],
                        word_count=summary_data['word_count'],
                        is_complete=summary_data['is_complete']
                    )
                    
                    page_summaries.append(page_summary)
                    
                    # Cache it
                    summary_cache[cache_key] = PageSummaryResponse(
                        **page_summary.dict(),
                        generated_at=datetime.now()
                    )
                    
            except Exception as e:
                logger.error(f"Error summarizing page {page_num}: {str(e)}")
                # Continue with other pages
                page_summaries.append(SummaryPage(
                    page_number=page_num,
                    summary=f"Erreur lors de la génération du résumé de la page {page_num}",
                    keywords=[],
                    word_count=0,
                    is_complete=False
                ))
        
        # Create document summary response
        response = DocumentSummaryResponse(
            document_name=Path(pdf_path).name,
            total_pages=len(available_pages),
            summarized_pages=len(page_summaries),
            page_summaries=page_summaries,
            generated_at=datetime.now()
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating document summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating document summary")


@router.get("/course/{course_id}/document/status")
async def get_summary_status(
    course_id: str,
    page_numbers: Optional[List[int]] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Check which pages have cached summaries"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        all_pages = pdf_service.extract_text_from_pdf(pdf_path)
        available_pages = list(all_pages.keys())
        
        if page_numbers:
            pages_to_check = page_numbers
        else:
            pages_to_check = available_pages[:20]  # Check first 20 pages
        
        status = {}
        for page_num in pages_to_check:
            cache_key = f"{pdf_path}:page:{page_num}"
            status[page_num] = {
                "has_summary": cache_key in summary_cache,
                "generated_at": summary_cache[cache_key].generated_at.isoformat() if cache_key in summary_cache else None
            }
        
        return {
            "document": Path(pdf_path).name,
            "total_pages": len(available_pages),
            "checked_pages": len(pages_to_check),
            "cached_summaries": sum(1 for v in status.values() if v["has_summary"]),
            "page_status": status
        }
        
    except Exception as e:
        logger.error(f"Error checking summary status: {str(e)}")
        raise HTTPException(status_code=500, detail="Error checking status")


@router.delete("/course/{course_id}/cache")
async def clear_summary_cache(
    course_id: str,
    page_numbers: Optional[List[int]] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Clear cached summaries"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        if page_numbers:
            # Clear specific pages
            cleared = 0
            for page_num in page_numbers:
                cache_key = f"{pdf_path}:page:{page_num}"
                if cache_key in summary_cache:
                    del summary_cache[cache_key]
                    cleared += 1
            
            return {
                "status": "success",
                "cleared_pages": cleared,
                "message": f"Cleared cache for {cleared} pages"
            }
        else:
            # Clear all summaries for this course
            cleared = 0
            keys_to_delete = [key for key in summary_cache.keys() if key.startswith(f"{pdf_path}:")]
            for key in keys_to_delete:
                del summary_cache[key]
                cleared += 1
            
            return {
                "status": "success",
                "cleared_pages": cleared,
                "message": f"Cleared {cleared} cached summaries for this course"
            }
            
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail="Error clearing cache")