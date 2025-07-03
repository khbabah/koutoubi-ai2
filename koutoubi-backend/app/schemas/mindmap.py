from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class MindmapNode(BaseModel):
    id: str
    text: str
    children: Optional[List['MindmapNode']] = []
    note: Optional[str] = None
    color: Optional[str] = None
    page: Optional[int] = None
    expanded: bool = True
    level: int = 0

MindmapNode.update_forward_refs()

class MindmapCreate(BaseModel):
    pdf_id: str
    content: Dict[str, Any]
    markdown: Optional[str] = None

class MindmapUpdate(BaseModel):
    note: Optional[str] = None
    color: Optional[str] = None
    expanded: Optional[bool] = None

class MindmapContent(BaseModel):
    root: MindmapNode
    markdown: str
    theme: Dict[str, Any] = Field(default_factory=lambda: {
        "colorScheme": ["#4A90E2", "#7ED321", "#F5A623", "#BD10E0", "#50E3C2"],
        "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
        "fontSize": 14,
        "nodeSpacing": {"vertical": 10, "horizontal": 80}
    })

class MindmapResponse(BaseModel):
    id: str
    pdf_id: str
    user_id: str
    content: str  # JSON string
    markdown: Optional[str]
    version: int
    is_ai_generated: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
        
    def get_content_dict(self) -> Dict[str, Any]:
        """Parse content JSON string to dictionary"""
        import json
        return json.loads(self.content) if self.content else {}