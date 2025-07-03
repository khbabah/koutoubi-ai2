"""
PDF Content API endpoints
Handles PDF-based content queries and AI interactions
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
import logging
from pathlib import Path

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.services.pdf_service import pdf_service
from app.services.llm_service import llm_service, ActionType
from app.api.content import get_available_courses
from app.schemas.pdf_content import (
    PDFSearchRequest,
    PDFSearchResponse,
    PDFQuestionRequest,
    PDFQuestionResponse,
    PDFContentResponse,
    PDFPageResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/course/{course_id}/info")
async def get_pdf_info(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get information about a course PDF"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        if not Path(pdf_path).exists():
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        # Extract basic info
        pages = pdf_service.extract_text_from_pdf(pdf_path)
        
        return {
            "course": course["title"],
            "filename": Path(pdf_path).name,
            "total_pages": len(pages),
            "available_pages": list(pages.keys())[:10],  # First 10 pages
            "file_size_mb": Path(pdf_path).stat().st_size / (1024 * 1024)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting PDF info: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing PDF")


@router.get("/course/{course_id}/page/{page_num}", response_model=PDFPageResponse)
async def get_pdf_page_content(
    course_id: str,
    page_num: int,
    current_user: User = Depends(get_current_user)
):
    """Get content of a specific page"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        content = pdf_service.get_page_content(pdf_path, page_num)
        
        if not content:
            raise HTTPException(status_code=404, detail=f"Page {page_num} not found")
        
        # Get structured content
        structured = pdf_service.extract_structured_content(pdf_path, page_num)
        
        return PDFPageResponse(
            page_number=page_num,
            content=content,
            structured_content=structured,
            word_count=len(content.split())
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting page content: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing page")


@router.post("/course/{course_id}/search", response_model=PDFSearchResponse)
async def search_pdf_content(
    course_id: str,
    request: PDFSearchRequest,
    current_user: User = Depends(get_current_user)
):
    """Search for content in the PDF"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        results = pdf_service.search_content(
            pdf_path,
            request.query,
            request.max_results
        )
        
        return PDFSearchResponse(
            query=request.query,
            results=results,
            total_results=len(results)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Error searching PDF")


@router.post("/course/{course_id}/ask", response_model=PDFQuestionResponse)
async def ask_question_about_pdf(
    course_id: str,
    request: PDFQuestionRequest,
    current_user: User = Depends(get_current_user)
):
    """Ask a question about the PDF content"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        # Get relevant content based on page or search
        if request.page_number:
            # Get content from specific page with context
            content, metadata = pdf_service.get_content_for_llm(
                pdf_path,
                request.page_number,
                request.context_pages
            )
        else:
            # Search for relevant content
            search_results = pdf_service.search_content(
                pdf_path,
                request.question,
                max_results=3
            )
            
            if search_results:
                # Combine content from top search results
                content_parts = []
                pages_used = []
                
                for result in search_results:
                    page_content = pdf_service.get_page_content(
                        pdf_path,
                        result['page']
                    )
                    if page_content:
                        content_parts.append(f"[Page {result['page']}]\n{page_content}")
                        pages_used.append(result['page'])
                
                content = "\n\n".join(content_parts)
                metadata = {
                    'source': Path(pdf_path).name,
                    'pages_searched': pages_used,
                    'search_query': request.question
                }
            else:
                # No specific results, use document summary
                content, metadata = pdf_service.get_content_for_llm(pdf_path)
        
        # Prepare context for LLM
        llm_context = f"""Document: {metadata.get('source', 'Unknown')}
Pages: {metadata.get('pages', metadata.get('pages_searched', 'Multiple'))}

Content:
{content}"""
        
        # Get answer from LLM
        answer = await llm_service.answer_question(
            request.question,
            content,
            llm_context
        )
        
        # Extract any page references from the answer
        import re
        page_refs = re.findall(r'page\s+(\d+)', answer, re.IGNORECASE)
        referenced_pages = list(set(int(p) for p in page_refs))
        
        return PDFQuestionResponse(
            question=request.question,
            answer=answer,
            source_pages=metadata.get('pages_searched', [request.page_number] if request.page_number else []),
            referenced_pages=referenced_pages,
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"Error answering question: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing question")


@router.post("/course/{course_id}/explain-page/{page_num}")
async def explain_pdf_page(
    course_id: str,
    page_num: int,
    focus_topic: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_user)
):
    """Get an explanation of a specific page's content"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        content = pdf_service.get_page_content(pdf_path, page_num)
        
        if not content:
            raise HTTPException(status_code=404, detail=f"Page {page_num} not found")
        
        # Create context for explanation
        context = f"Page {page_num} du manuel de mathématiques"
        if focus_topic:
            context += f", focus sur: {focus_topic}"
        
        # Get explanation from LLM
        explanation = await llm_service.explain_content(content, context)
        
        return {
            "page_number": page_num,
            "focus_topic": focus_topic,
            "explanation": explanation,
            "content_preview": content[:200] + "..." if len(content) > 200 else content
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error explaining page: {str(e)}")
        raise HTTPException(status_code=500, detail="Error explaining page")


@router.post("/course/{course_id}/generate-quiz/{page_num}")
async def generate_quiz_from_page(
    course_id: str,
    page_num: int,
    num_questions: int = Query(5, ge=1, le=10),
    difficulty: str = Query("medium", pattern="^(easy|medium|hard)$"),
    current_user: User = Depends(get_current_user)
):
    """Generate a quiz based on a page's content"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        content = pdf_service.get_page_content(pdf_path, page_num)
        
        if not content:
            raise HTTPException(status_code=404, detail=f"Page {page_num} not found")
        
        # Generate quiz
        quiz_data = await llm_service.generate_quiz(
            content,
            num_questions,
            difficulty
        )
        
        # Add page reference to quiz
        quiz_data['source_page'] = page_num
        quiz_data['content_preview'] = content[:200] + "..." if len(content) > 200 else content
        
        return quiz_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating quiz")


@router.get("/course/{course_id}/extract-all")
async def extract_all_content(
    course_id: str,
    force_refresh: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """Extract and cache all content from the PDF (admin operation)"""
    try:
        # Get available courses
        courses = get_available_courses()
        
        # Find the specific course
        course = next((c for c in courses if c["id"] == course_id), None)
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        pdf_path = course["pdf_path"]
        
        pages = pdf_service.extract_text_from_pdf(pdf_path, force_refresh)
        
        # Calculate some statistics
        total_words = sum(len(content.split()) for content in pages.values())
        avg_words_per_page = total_words / len(pages) if pages else 0
        
        return {
            "status": "success",
            "total_pages_extracted": len(pages),
            "total_words": total_words,
            "average_words_per_page": round(avg_words_per_page),
            "cache_refreshed": force_refresh,
            "sample_pages": {
                page: content[:100] + "..." 
                for page, content in list(pages.items())[:3]
            }
        }
        
    except Exception as e:
        logger.error(f"Error extracting PDF content: {str(e)}")
        raise HTTPException(status_code=500, detail="Error extracting content")