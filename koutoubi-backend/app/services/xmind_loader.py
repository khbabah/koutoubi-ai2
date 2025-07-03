import json
import os
import zipfile
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class XMindLoader:
    """Load and convert XMind files for display"""
    
    def __init__(self, mindmaps_dir: str = "mindmaps"):
        self.mindmaps_dir = mindmaps_dir
        
    def load_mindmap_for_pdf(self, pdf_id: str) -> Optional[Dict[str, Any]]:
        """Load pre-created mindmap for a specific PDF"""
        try:
            # Try JSON format first
            json_path = os.path.join(self.mindmaps_dir, f"{pdf_id}.json")
            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            
            # Try XMind format
            xmind_path = os.path.join(self.mindmaps_dir, f"{pdf_id}.xmind")
            if os.path.exists(xmind_path):
                return self._parse_xmind_file(xmind_path)
                
            logger.warning(f"No mindmap found for PDF: {pdf_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error loading mindmap: {str(e)}")
            return None
    
    def _parse_xmind_file(self, xmind_path: str) -> Dict[str, Any]:
        """Parse XMind file format (ZIP archive)"""
        try:
            with zipfile.ZipFile(xmind_path, 'r') as xmind:
                # XMind stores content in content.json
                content_json = xmind.read('content.json').decode('utf-8')
                content = json.loads(content_json)
                
                # Convert XMind format to our format
                return self._convert_xmind_to_standard(content)
                
        except Exception as e:
            logger.error(f"Error parsing XMind file: {str(e)}")
            raise
    
    def _convert_xmind_to_standard(self, xmind_content: Dict) -> Dict[str, Any]:
        """Convert XMind structure to our standard format"""
        # This would need to be adapted based on actual XMind export format
        # For now, return a structure compatible with our viewer
        
        sheet = xmind_content[0]['rootTopic']
        
        def convert_topic(topic):
            node = {
                "id": topic.get('id', ''),
                "text": topic.get('title', ''),
                "children": []
            }
            
            if 'children' in topic and 'attached' in topic['children']:
                for child in topic['children']['attached']:
                    node['children'].append(convert_topic(child))
                    
            return node
        
        return {
            "root": convert_topic(sheet),
            "theme": {
                "colorScheme": ["#5B69C3", "#48B4E0", "#7ED321", "#F5A623", "#E94B3C"],
                "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
                "fontSize": 15,
                "nodeSpacing": {"vertical": 20, "horizontal": 120}
            }
        }
    
    def list_available_mindmaps(self) -> list:
        """List all available mindmaps"""
        mindmaps = []
        if os.path.exists(self.mindmaps_dir):
            for file in os.listdir(self.mindmaps_dir):
                if file.endswith(('.json', '.xmind')):
                    pdf_id = file.rsplit('.', 1)[0]
                    mindmaps.append(pdf_id)
        return mindmaps