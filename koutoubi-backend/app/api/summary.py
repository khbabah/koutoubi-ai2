from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json
import uuid
import asyncio

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.chapter import Chapter as ChapterModel
from app.models.summary import ChapterSummary as SummaryModel
from app.schemas.summary import ChapterSummary, SummaryPoint
from app.services.llm_service import llm_service, ActionType

router = APIRouter()


async def generate_summary_with_llm(chapter, content: Optional[str] = None):
    """Generate summary using LLM service"""
    try:
        # Use chapter title and metadata if no content provided
        if not content:
            content = f"Chapitre: {chapter.title}\nNiveau: {chapter.niveau}\nMatière: {chapter.matiere}\nPages: {chapter.page_start} à {chapter.page_end}"
        
        # Generate summary points using LLM
        summary_points_text = await llm_service.generate_summary(content, max_points=5)
        
        # Convert to structured format
        points = []
        for idx, point_text in enumerate(summary_points_text):
            points.append({
                "id": str(uuid.uuid4()),
                "text": point_text,
                "pages": [chapter.page_start + idx] if chapter.page_start else [1 + idx],
                "primary_page": chapter.page_start + idx if chapter.page_start else 1 + idx,
                "keywords": extract_keywords(point_text)
            })
        
        return points
    except Exception as e:
        # Fallback to basic summary if LLM fails
        return [
            {
                "id": str(uuid.uuid4()),
                "text": f"**{chapter.title}** est un chapitre du programme de {chapter.niveau} en {chapter.matiere}.",
                "pages": [chapter.page_start] if chapter.page_start else [1],
                "primary_page": chapter.page_start if chapter.page_start else 1,
                "keywords": [chapter.title, chapter.matiere]
            }
        ]

def extract_keywords(text: str) -> List[str]:
    """Extract keywords from text (simple implementation)"""
    # Remove markdown formatting
    text = text.replace('**', '').replace('*', '')
    # Extract words in bold or important terms
    words = text.split()
    keywords = []
    for word in words:
        if len(word) > 5 and word[0].isupper():
            keywords.append(word.strip('.,!?'))
    return keywords[:3]  # Return top 3 keywords


@router.get("/chapter/{chapter_id}", response_model=ChapterSummary)
async def get_chapter_summary(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if chapter exists
    chapter = db.query(ChapterModel).filter(ChapterModel.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Check for existing summary
    summary = db.query(SummaryModel).filter(
        SummaryModel.chapter_id == chapter_id,
        SummaryModel.user_id == current_user.id
    ).first()
    
    # Check global summary if no user-specific one
    if not summary:
        summary = db.query(SummaryModel).filter(
            SummaryModel.chapter_id == chapter_id,
            SummaryModel.user_id == None
        ).first()
    
    # Generate if not exists or expired
    now = datetime.utcnow()
    if not summary or (summary.expires_at and summary.expires_at < now):
        # Generate summary using LLM
        summary_points = await generate_summary_with_llm(chapter)
        
        # Save to database
        if summary:
            # Update existing
            summary.summary_points = json.dumps(summary_points)
            summary.generated_at = now
            summary.expires_at = now + timedelta(days=1)
        else:
            # Create new
            summary = SummaryModel(
                chapter_id=chapter_id,
                user_id=None,  # Global summary
                summary_points=json.dumps(summary_points),
                generated_at=now,
                expires_at=now + timedelta(days=1)
            )
            db.add(summary)
        
        db.commit()
    
    # Convert to response
    points = json.loads(summary.summary_points)
    summary_points = [SummaryPoint(**point) for point in points]
    
    return ChapterSummary(
        chapter_id=chapter_id,
        summary_points=summary_points,
        total_points=len(summary_points),
        generated_at=summary.generated_at,
        expires_at=summary.expires_at
    )


@router.post("/chapter/{chapter_id}/regenerate")
async def regenerate_chapter_summary(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Force regenerate summary for a chapter"""
    # Check if chapter exists
    chapter = db.query(ChapterModel).filter(ChapterModel.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Delete existing summaries
    db.query(SummaryModel).filter(
        SummaryModel.chapter_id == chapter_id,
        SummaryModel.user_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {"status": "success", "message": "Summary will be regenerated on next access"}