#!/usr/bin/env python3
"""
Batch generate mindmaps for all PDFs
Can use XMind AI credits efficiently or local LLM
"""
import asyncio
import json
import os
from pathlib import Path
import logging

# Add parent directory to path
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ai_mindmap_generator import AIMindmapGenerator
from app.services.pdf_service import PDFService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BatchMindmapGenerator:
    def __init__(self):
        self.ai_generator = AIMindmapGenerator()
        self.pdf_service = PDFService()
        self.output_dir = Path("mindmaps")
        self.output_dir.mkdir(exist_ok=True)
        
    async def generate_for_all_pdfs(self):
        """Generate mindmaps for all PDFs in the system"""
        pdf_files = self._get_all_pdf_files()
        
        logger.info(f"Found {len(pdf_files)} PDFs to process")
        
        for i, pdf_path in enumerate(pdf_files, 1):
            pdf_id = self._get_pdf_id(pdf_path)
            output_path = self.output_dir / f"{pdf_id}.json"
            
            # Skip if already exists
            if output_path.exists():
                logger.info(f"[{i}/{len(pdf_files)}] Skipping {pdf_id} - already exists")
                continue
            
            logger.info(f"[{i}/{len(pdf_files)}] Processing {pdf_id}...")
            
            try:
                # Extract PDF content (first 50 pages for efficiency)
                content = await self.pdf_service.extract_text(str(pdf_path), max_pages=50)
                
                # Generate mindmap
                mindmap = await self.ai_generator.generate_from_pdf_content(
                    content, 
                    title=pdf_id.replace("-", " ").title()
                )
                
                # Add markdown for visualization
                mindmap["markdown"] = self._convert_to_markdown(mindmap["root"])
                
                # Save to file
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(mindmap, f, ensure_ascii=False, indent=2)
                
                logger.info(f"✅ Generated mindmap for {pdf_id}")
                
                # Rate limiting - pause between generations
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"❌ Error processing {pdf_id}: {str(e)}")
                continue
    
    def _get_all_pdf_files(self) -> list:
        """Get all PDF files from content directory"""
        content_dir = Path("../content/pdf")
        pdf_files = []
        
        for pdf_file in content_dir.rglob("*.pdf"):
            pdf_files.append(pdf_file)
            
        return pdf_files
    
    def _get_pdf_id(self, pdf_path: Path) -> str:
        """Generate PDF ID from path"""
        # Example: content/pdf/secondaire2/4eme/mathematiques.pdf 
        # -> secondaire2-4eme-mathematiques
        parts = pdf_path.stem.split("/")[-3:]  # Get last 3 parts
        return "-".join(parts)
    
    def _convert_to_markdown(self, node: dict, level: int = 0) -> str:
        """Convert mindmap to markdown format"""
        indent = "#" * (level + 1)
        markdown = f"{indent} {node['text']}\n"
        
        for child in node.get('children', []):
            markdown += self._convert_to_markdown(child, level + 1)
            
        return markdown

async def main():
    """Main function"""
    generator = BatchMindmapGenerator()
    await generator.generate_for_all_pdfs()

if __name__ == "__main__":
    asyncio.run(main())