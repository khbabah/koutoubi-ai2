"""
Content service for managing educational content.
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.chapter import Chapter
from app.models.progress import UserProgress
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)


class ContentService:
    """Service for managing educational content."""
    
    def __init__(self):
        self.content_path = Path(settings.CONTENT_PATH)
        self.pdf_path = self.content_path / "pdf"
        self.md_path = self.content_path / "md_pages"
    
    def get_course_list(self) -> List[Dict[str, Any]]:
        """Get list of all available courses."""
        courses = []
        
        # Define the levels and their display names
        levels = {
            "fondamental": "Fondamental",
            "secondaire1": "Secondaire 1er cycle",
            "secondaire2": "Secondaire 2ème cycle"
        }
        
        for level_key, level_name in levels.items():
            level_path = self.pdf_path / level_key
            if not level_path.exists():
                continue
                
            # Get all year directories
            for year_dir in sorted(level_path.iterdir()):
                if not year_dir.is_dir():
                    continue
                    
                year = year_dir.name  # e.g., "1AF", "2AS"
                
                # Get all subject PDFs in this year
                for pdf_file in year_dir.glob("*.pdf"):
                    subject = pdf_file.stem  # filename without extension
                    
                    course = {
                        "niveau": level_key,
                        "niveau_display": level_name,
                        "annee": year,
                        "matiere": subject,
                        "path": str(pdf_file.relative_to(self.content_path)),
                        "size": pdf_file.stat().st_size,
                        "last_modified": datetime.fromtimestamp(pdf_file.stat().st_mtime).isoformat()
                    }
                    courses.append(course)
        
        return courses
    
    def get_course_info(self, niveau: str, annee: str, matiere: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific course."""
        pdf_path = self.pdf_path / niveau / annee / f"{matiere}.pdf"
        
        if not pdf_path.exists():
            return None
            
        # Check if we have extracted markdown content
        md_dir = self.md_path / niveau / annee / matiere
        has_content = md_dir.exists() and any(md_dir.glob("*.md"))
        
        return {
            "niveau": niveau,
            "annee": annee,
            "matiere": matiere,
            "pdf_path": str(pdf_path.relative_to(self.content_path)),
            "has_extracted_content": has_content,
            "size": pdf_path.stat().st_size,
            "last_modified": datetime.fromtimestamp(pdf_path.stat().st_mtime).isoformat()
        }
    
    def get_page_content(
        self, 
        niveau: str, 
        annee: str, 
        matiere: str, 
        page: int
    ) -> Optional[Dict[str, Any]]:
        """Get content for a specific page."""
        md_file = self.md_path / niveau / annee / matiere / f"page_{page}.md"
        
        if not md_file.exists():
            return None
            
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract metadata if present
        metadata = {}
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                # Parse YAML-like metadata
                meta_lines = parts[1].strip().split("\n")
                for line in meta_lines:
                    if ":" in line:
                        key, value = line.split(":", 1)
                        metadata[key.strip()] = value.strip()
                content = parts[2].strip()
        
        return {
            "page": page,
            "content": content,
            "metadata": metadata,
            "next_page": page + 1 if (self.md_path / niveau / annee / matiere / f"page_{page + 1}.md").exists() else None,
            "prev_page": page - 1 if page > 1 and (self.md_path / niveau / annee / matiere / f"page_{page - 1}.md").exists() else None
        }
    
    def search_content(
        self, 
        query: str, 
        niveau: Optional[str] = None,
        annee: Optional[str] = None,
        matiere: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search content across courses."""
        results = []
        search_paths = []
        
        # Determine search scope
        if niveau and annee and matiere:
            search_paths = [self.md_path / niveau / annee / matiere]
        elif niveau and annee:
            search_paths = [self.md_path / niveau / annee]
        elif niveau:
            search_paths = [self.md_path / niveau]
        else:
            search_paths = [self.md_path]
        
        # Search in markdown files
        for search_path in search_paths:
            if not search_path.exists():
                continue
                
            for md_file in search_path.rglob("*.md"):
                try:
                    with open(md_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Simple search - check if query is in content
                    if query.lower() in content.lower():
                        # Extract context around the match
                        lower_content = content.lower()
                        index = lower_content.find(query.lower())
                        start = max(0, index - 100)
                        end = min(len(content), index + len(query) + 100)
                        context = content[start:end]
                        
                        # Parse path to get course info
                        parts = md_file.relative_to(self.md_path).parts
                        if len(parts) >= 4:  # niveau/annee/matiere/page_X.md
                            result = {
                                "niveau": parts[0],
                                "annee": parts[1],
                                "matiere": parts[2],
                                "page": int(parts[3].replace("page_", "").replace(".md", "")),
                                "context": context,
                                "match_index": index
                            }
                            results.append(result)
                            
                            if len(results) >= limit:
                                return results
                                
                except Exception as e:
                    logger.error(f"Error searching file {md_file}: {str(e)}")
                    continue
        
        # Sort by relevance (simple: earlier matches are better)
        results.sort(key=lambda x: x["match_index"])
        
        return results[:limit]
    
    def get_chapter_structure(
        self, 
        niveau: str, 
        annee: str, 
        matiere: str
    ) -> List[Dict[str, Any]]:
        """Get chapter structure for a course."""
        # Look for a structure file
        structure_file = self.md_path / niveau / annee / matiere / "structure.json"
        
        if structure_file.exists():
            with open(structure_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # Otherwise, try to infer from content
        chapters = []
        md_dir = self.md_path / niveau / annee / matiere
        
        if not md_dir.exists():
            return chapters
            
        # Simple heuristic: look for chapter markers in content
        current_chapter = None
        for md_file in sorted(md_dir.glob("page_*.md")):
            page_num = int(md_file.stem.replace("page_", ""))
            
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Look for chapter headers (customize based on your content)
            for line in content.split('\n'):
                if line.strip().startswith('# Chapitre') or line.strip().startswith('## Chapitre'):
                    if current_chapter:
                        current_chapter['end_page'] = page_num - 1
                        
                    current_chapter = {
                        'title': line.strip().replace('#', '').strip(),
                        'start_page': page_num,
                        'end_page': None  # Will be set when next chapter found
                    }
                    chapters.append(current_chapter)
                    break
        
        # Set end page for last chapter
        if current_chapter and current_chapter['end_page'] is None:
            # Find last page
            last_page = max(
                int(f.stem.replace("page_", ""))
                for f in md_dir.glob("page_*.md")
            )
            current_chapter['end_page'] = last_page
        
        return chapters
    
    # TODO: Implement track_progress when a proper CourseProgress model is created
    # The current UserProgress model is designed for flashcards and quiz questions,
    # not for tracking general course page navigation.
    # def track_progress(
    #     self,
    #     db: Session,
    #     user_id: int,
    #     niveau: str,
    #     annee: str,
    #     matiere: str,
    #     page: int,
    #     time_spent: int = 0
    # ):
    #     """Track user progress on a page."""
    #     pass


# Singleton instance
content_service = ContentService()