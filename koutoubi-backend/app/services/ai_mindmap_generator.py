import json
import asyncio
from typing import Dict, Any, List, Optional
import logging
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

class AIMindmapGenerator:
    """Generate professional mindmaps using local LLM"""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.max_depth = 4
        self.max_children = 6
        
    async def generate_from_pdf_content(self, pdf_content: str, title: str = None) -> Dict[str, Any]:
        """Generate a professional mindmap from PDF content"""
        try:
            # Extract key topics and structure
            structure_prompt = f"""
            Analyse ce contenu PDF et génère une structure de mindmap professionnelle.
            
            Contenu: {pdf_content[:3000]}...
            
            Génère une structure JSON avec:
            1. Un titre principal clair
            2. 4-6 branches principales (concepts clés)
            3. 2-4 sous-branches pour chaque branche
            4. Points clés, définitions, formules importantes
            
            Format JSON attendu:
            {{
                "title": "Titre du document",
                "branches": [
                    {{
                        "id": "b1",
                        "title": "Concept Principal 1",
                        "color": "#5B69C3",
                        "keywords": ["mot1", "mot2"],
                        "subbranches": [
                            {{
                                "id": "b1-1",
                                "title": "Sous-concept",
                                "description": "Explication courte",
                                "type": "definition|concept|formula|example",
                                "page": 10
                            }}
                        ]
                    }}
                ]
            }}
            
            Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.
            """
            
            # Get AI response
            response = await self.llm_service.generate_content(
                prompt=structure_prompt,
                context="mindmap_generation",
                temperature=0.7
            )
            
            # Parse JSON response
            try:
                mindmap_data = json.loads(response)
            except json.JSONDecodeError:
                # Extract JSON from response if wrapped in text
                import re
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    mindmap_data = json.loads(json_match.group())
                else:
                    raise ValueError("Could not parse AI response as JSON")
            
            # Convert to our standard format
            return self._convert_to_standard_format(mindmap_data)
            
        except Exception as e:
            logger.error(f"Error generating AI mindmap: {str(e)}")
            # Fallback to a simple structure
            return self._create_fallback_structure(title or "Document")
    
    async def enhance_existing_mindmap(self, mindmap: Dict[str, Any], pdf_content: str) -> Dict[str, Any]:
        """Enhance an existing mindmap with AI-generated details"""
        try:
            enhance_prompt = f"""
            J'ai cette structure de mindmap: {json.dumps(mindmap, ensure_ascii=False)}
            
            Et ce contenu PDF: {pdf_content[:2000]}...
            
            Enrichis la mindmap avec:
            1. Descriptions détaillées pour chaque nœud
            2. Exemples concrets
            3. Formules ou concepts clés
            4. Numéros de pages pertinents
            
            Garde la même structure mais ajoute des détails.
            Réponds en JSON.
            """
            
            response = await self.llm_service.generate_content(
                prompt=enhance_prompt,
                context="mindmap_enhancement"
            )
            
            enhanced_data = json.loads(response)
            return self._merge_enhancements(mindmap, enhanced_data)
            
        except Exception as e:
            logger.error(f"Error enhancing mindmap: {str(e)}")
            return mindmap
    
    def _convert_to_standard_format(self, ai_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert AI response to our standard mindmap format"""
        
        def create_node(branch: Dict[str, Any], level: int = 0) -> Dict[str, Any]:
            node = {
                "id": branch.get("id", f"node-{level}"),
                "text": branch.get("title", ""),
                "color": branch.get("color"),
                "type": branch.get("type", "concept"),
                "page": branch.get("page"),
                "children": []
            }
            
            if "description" in branch:
                node["note"] = branch["description"]
            
            # Add subbranches as children
            for i, subbranch in enumerate(branch.get("subbranches", [])):
                child = create_node(subbranch, level + 1)
                node["children"].append(child)
            
            return node
        
        # Create root node
        root = {
            "id": "root",
            "text": ai_data.get("title", "Mindmap"),
            "children": []
        }
        
        # Add main branches
        for branch in ai_data.get("branches", []):
            root["children"].append(create_node(branch))
        
        # Color scheme
        colors = [
            "#5B69C3", "#48B4E0", "#7ED321", "#F5A623", 
            "#E94B3C", "#9B59B6", "#1ABC9C", "#34495E"
        ]
        
        return {
            "root": root,
            "theme": {
                "colorScheme": colors,
                "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
                "fontSize": 15,
                "nodeSpacing": {"vertical": 20, "horizontal": 120}
            }
        }
    
    def _create_fallback_structure(self, title: str) -> Dict[str, Any]:
        """Create a simple fallback structure"""
        return {
            "root": {
                "id": "root",
                "text": title,
                "children": [
                    {
                        "id": "intro",
                        "text": "Introduction",
                        "children": []
                    },
                    {
                        "id": "main",
                        "text": "Concepts Principaux",
                        "children": []
                    },
                    {
                        "id": "examples",
                        "text": "Exemples et Applications",
                        "children": []
                    },
                    {
                        "id": "summary",
                        "text": "Résumé",
                        "children": []
                    }
                ]
            },
            "theme": {
                "colorScheme": ["#5B69C3", "#48B4E0", "#7ED321", "#F5A623"],
                "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
                "fontSize": 15,
                "nodeSpacing": {"vertical": 20, "horizontal": 120}
            }
        }
    
    def _merge_enhancements(self, original: Dict[str, Any], enhanced: Dict[str, Any]) -> Dict[str, Any]:
        """Merge AI enhancements into original mindmap"""
        # Implementation would merge the enhanced details
        # while preserving the original structure
        return enhanced if enhanced else original