from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import json
import uuid
import re
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, validator

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.mindmap import Mindmap
from app.schemas.mindmap import MindmapCreate, MindmapResponse, MindmapUpdate
from app.services.mindmap_generator_simple import MindmapGeneratorSimple as MindmapGenerator
import logging

logger = logging.getLogger(__name__)

# Input validation models
class PDFIdValidator(BaseModel):
    pdf_id: str = Field(..., pattern="^[a-zA-Z0-9-_]+$", max_length=100)
    
    @validator('pdf_id')
    def validate_pdf_id(cls, v):
        if '..' in v or '/' in v or '\\' in v:
            raise ValueError('Invalid PDF ID - contains forbidden characters')
        return v

class MindmapNodeUpdateValidated(BaseModel):
    note: Optional[str] = Field(None, max_length=1000)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    expanded: Optional[bool] = None

router = APIRouter()

@router.post("/generate/{pdf_id}", response_model=MindmapResponse)
async def generate_mindmap(
    pdf_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate or retrieve mindmap for a PDF document"""
    try:
        # Validate PDF ID
        validator = PDFIdValidator(pdf_id=pdf_id)
        pdf_id = validator.pdf_id
        
        # Use authenticated user ID
        user_id = current_user.id
        
        # Check if mindmap already exists in DB
        existing_mindmap = db.query(Mindmap).filter(
            Mindmap.pdf_id == pdf_id,
            Mindmap.user_id == user_id
        ).first()
        
        if existing_mindmap:
            return MindmapResponse.model_validate(existing_mindmap)
        
        # Generate mindmap content
        generator = MindmapGenerator()
        mindmap_data = await generator.generate_from_pdf(pdf_id)
        
        # Create new mindmap
        new_mindmap = Mindmap(
            id=str(uuid.uuid4()),
            pdf_id=pdf_id,
            user_id=user_id,
            content=json.dumps(mindmap_data),
            markdown=mindmap_data.get("markdown", ""),
            version=1,
            is_ai_generated=True
        )
        db.add(new_mindmap)
        db.commit()
        db.refresh(new_mindmap)
        
        logger.info(f"Generated new mindmap for PDF {pdf_id}")
        return MindmapResponse.model_validate(new_mindmap)
        
    except Exception as e:
        logger.error(f"Error generating mindmap: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate mindmap")

@router.get("/{pdf_id}", response_model=MindmapResponse)
async def get_mindmap(
    pdf_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get existing mindmap for a PDF"""
    # Validate PDF ID
    validator = PDFIdValidator(pdf_id=pdf_id)
    pdf_id = validator.pdf_id
    
    mindmap = db.query(Mindmap).filter(
        Mindmap.pdf_id == pdf_id,
        Mindmap.user_id == current_user.id
    ).first()
    
    if not mindmap:
        raise HTTPException(status_code=404, detail="Mindmap not found")
    
    return MindmapResponse.model_validate(mindmap)

@router.put("/{pdf_id}/nodes/{node_id}", response_model=MindmapResponse)
async def update_node(
    pdf_id: str,
    node_id: str,
    update_data: MindmapNodeUpdateValidated,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific node in the mindmap (add notes, etc.)"""
    # Validate PDF ID
    validator = PDFIdValidator(pdf_id=pdf_id)
    pdf_id = validator.pdf_id
    mindmap = db.query(Mindmap).filter(
        Mindmap.pdf_id == pdf_id,
        Mindmap.user_id == current_user.id
    ).first()
    
    if not mindmap:
        raise HTTPException(status_code=404, detail="Mindmap not found")
    
    # Update node in content
    content = json.loads(mindmap.content)
    node = find_node_by_id(content.get("root"), node_id)
    
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Apply updates
    if update_data.note is not None:
        node["note"] = update_data.note
    if update_data.color is not None:
        node["color"] = update_data.color
    if update_data.expanded is not None:
        node["expanded"] = update_data.expanded
    
    # Save back
    mindmap.content = json.dumps(content)
    mindmap.updated_at = datetime.utcnow()
    mindmap.version += 1
    
    db.commit()
    db.refresh(mindmap)
    
    # Update complete
    
    return MindmapResponse.model_validate(mindmap)

def find_node_by_id(node: Dict[str, Any], node_id: str) -> Optional[Dict[str, Any]]:
    """Recursively find a node by ID"""
    if node.get("id") == node_id:
        return node
    
    for child in node.get("children", []):
        found = find_node_by_id(child, node_id)
        if found:
            return found
    
    return None