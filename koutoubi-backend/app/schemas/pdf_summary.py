"""
Schemas for PDF summary endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PageSummaryRequest(BaseModel):
    page_number: int = Field(..., ge=1)
    force_refresh: bool = Field(False)
    
    class Config:
        json_schema_extra = {
            "example": {
                "page_number": 1,
                "force_refresh": False
            }
        }


class PageSummaryResponse(BaseModel):
    page_number: int
    summary: str
    keywords: List[str]
    word_count: int
    is_complete: bool
    generated_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "page_number": 1,
                "summary": "Cette page introduit les concepts fondamentaux des fractions...",
                "keywords": ["fractions", "numérateur", "dénominateur"],
                "word_count": 120,
                "is_complete": True,
                "generated_at": "2024-01-27T10:30:00"
            }
        }


class SummaryPage(BaseModel):
    """Summary data for a single page"""
    page_number: int
    summary: str
    keywords: List[str]
    word_count: int
    is_complete: bool


class DocumentSummaryRequest(BaseModel):
    page_numbers: Optional[List[int]] = Field(None, description="Specific pages to summarize")
    max_pages: int = Field(10, ge=1, le=50, description="Maximum pages to summarize if page_numbers not specified")
    force_refresh: bool = Field(False)
    
    class Config:
        json_schema_extra = {
            "example": {
                "page_numbers": [1, 2, 3, 5, 8],
                "max_pages": 10,
                "force_refresh": False
            }
        }


class DocumentSummaryResponse(BaseModel):
    document_name: str
    total_pages: int
    summarized_pages: int
    page_summaries: List[SummaryPage]
    generated_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "document_name": "mathematiques.pdf",
                "total_pages": 150,
                "summarized_pages": 5,
                "page_summaries": [
                    {
                        "page_number": 1,
                        "summary": "Introduction aux mathématiques...",
                        "keywords": ["mathématiques", "introduction"],
                        "word_count": 120,
                        "is_complete": True
                    }
                ],
                "generated_at": "2024-01-27T10:30:00"
            }
        }