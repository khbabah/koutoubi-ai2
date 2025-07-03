"""
Schemas for PDF content endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class PDFSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)
    max_results: int = Field(5, ge=1, le=20)
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "fractions",
                "max_results": 5
            }
        }


class PDFSearchResult(BaseModel):
    page: int
    context: str
    score: int


class PDFSearchResponse(BaseModel):
    query: str
    results: List[PDFSearchResult]
    total_results: int


class PDFQuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    page_number: Optional[int] = Field(None, ge=1)
    context_pages: int = Field(1, ge=0, le=5)
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "Comment calculer le périmètre d'un cercle?",
                "page_number": 10,
                "context_pages": 1
            }
        }


class PDFQuestionResponse(BaseModel):
    question: str
    answer: str
    source_pages: List[int]
    referenced_pages: List[int]
    metadata: Dict[str, Any]


class PDFContentResponse(BaseModel):
    content: str
    page_number: int
    total_pages: int
    metadata: Optional[Dict[str, Any]] = None


class PDFPageResponse(BaseModel):
    page_number: int
    content: str
    structured_content: Dict[str, List[str]]
    word_count: int