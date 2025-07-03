"""
PDF Content Service
Handles PDF text extraction, chunking, and content management
"""
import logging
from typing import List, Dict, Optional, Tuple
import re
from pathlib import Path
import hashlib
import json
from datetime import datetime

# Try to import PyMuPDF, fallback to PyPDF2
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False
    import PyPDF2

logger = logging.getLogger(__name__)


class PDFService:
    def __init__(self, cache_dir: str = "./pdf_cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.chunk_size = 1000  # Characters per chunk
        self.chunk_overlap = 200  # Overlap between chunks
        
    def _get_cache_path(self, pdf_path: str) -> Path:
        """Generate cache file path for a PDF"""
        # Create a hash of the PDF path for consistent cache naming
        path_hash = hashlib.md5(pdf_path.encode()).hexdigest()
        return self.cache_dir / f"{path_hash}_content.json"
    
    def extract_text_from_pdf(self, pdf_path: str, force_refresh: bool = False) -> Dict[int, str]:
        """Extract text from PDF, with caching"""
        cache_path = self._get_cache_path(pdf_path)
        
        # Check cache first
        if not force_refresh and cache_path.exists():
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                    logger.info(f"Loaded PDF content from cache: {cache_path}")
                    return {int(k): v for k, v in cache_data['pages'].items()}
            except Exception as e:
                logger.warning(f"Failed to load cache: {e}")
        
        # Extract text from PDF
        logger.info(f"Extracting text from PDF: {pdf_path}")
        pages_text = {}
        
        try:
            if HAS_PYMUPDF:
                # Use PyMuPDF (better quality)
                pdf_document = fitz.open(pdf_path)
                total_pages = len(pdf_document)
                
                for page_num in range(total_pages):
                    page = pdf_document[page_num]
                    text = page.get_text()
                    
                    # Clean up text
                    text = self._clean_text(text)
                    
                    if text.strip():  # Only store non-empty pages
                        pages_text[page_num + 1] = text  # 1-indexed
                        
                    if (page_num + 1) % 10 == 0:
                        logger.info(f"Processed {page_num + 1}/{total_pages} pages")
                
                pdf_document.close()
            else:
                # Fallback to PyPDF2
                logger.info("Using PyPDF2 (install PyMuPDF for better quality)")
                
                # Ensure PyCryptodome is available for encrypted PDFs
                try:
                    import Cryptodome
                    logger.info("PyCryptodome available for encrypted PDFs")
                except ImportError:
                    try:
                        import Crypto
                        logger.info("PyCrypto available for encrypted PDFs")
                    except ImportError:
                        logger.warning("No crypto library available - encrypted PDFs may fail")
                
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    
                    # Check if PDF is encrypted
                    if pdf_reader.is_encrypted:
                        logger.info("PDF is encrypted, attempting to decrypt...")
                        # Try empty password first (common for "protected" but not truly encrypted PDFs)
                        if not pdf_reader.decrypt(''):
                            logger.warning("Could not decrypt PDF with empty password")
                            # You could try other common passwords here
                    
                    total_pages = len(pdf_reader.pages)
                    
                    for page_num in range(total_pages):
                        try:
                            page = pdf_reader.pages[page_num]
                            text = page.extract_text()
                            
                            # Clean up text
                            text = self._clean_text(text)
                            
                            if text.strip():  # Only store non-empty pages
                                pages_text[page_num + 1] = text  # 1-indexed
                                
                            if (page_num + 1) % 10 == 0:
                                logger.info(f"Processed {page_num + 1}/{total_pages} pages")
                        except Exception as e:
                            logger.warning(f"Failed to extract text from page {page_num + 1}: {str(e)}")
                            # Store empty content for failed pages
                            pages_text[page_num + 1] = f"[Erreur d'extraction: {str(e)}]"
            
            # Cache the extracted content
            cache_data = {
                'pdf_path': pdf_path,
                'extracted_at': datetime.now().isoformat(),
                'total_pages': total_pages,
                'pages': pages_text
            }
            
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Extracted text from {len(pages_text)} pages and cached")
            return pages_text
            
        except Exception as e:
            logger.error(f"Error extracting PDF text: {str(e)}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common OCR issues
        text = text.replace('ﬁ', 'fi')
        text = text.replace('ﬂ', 'fl')
        text = text.replace('œ', 'oe')
        text = text.replace('æ', 'ae')
        
        # Remove page numbers at the bottom (common pattern)
        text = re.sub(r'\n\d+\s*$', '', text)
        
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        return text.strip()
    
    def get_page_content(self, pdf_path: str, page_num: int) -> Optional[str]:
        """Get content of a specific page"""
        pages = self.extract_text_from_pdf(pdf_path)
        return pages.get(page_num)
    
    def get_page_range_content(self, pdf_path: str, start_page: int, end_page: int) -> str:
        """Get content from a range of pages"""
        pages = self.extract_text_from_pdf(pdf_path)
        content_parts = []
        
        for page_num in range(start_page, end_page + 1):
            if page_num in pages:
                content_parts.append(f"[Page {page_num}]\n{pages[page_num]}")
        
        return "\n\n".join(content_parts)
    
    def search_content(self, pdf_path: str, query: str, max_results: int = 5) -> List[Dict]:
        """Search for content in the PDF"""
        pages = self.extract_text_from_pdf(pdf_path)
        results = []
        query_lower = query.lower()
        
        for page_num, content in pages.items():
            if query_lower in content.lower():
                # Find the context around the match
                index = content.lower().find(query_lower)
                start = max(0, index - 100)
                end = min(len(content), index + len(query) + 100)
                
                context = content[start:end]
                if start > 0:
                    context = "..." + context
                if end < len(content):
                    context = context + "..."
                
                results.append({
                    'page': page_num,
                    'context': context,
                    'score': content.lower().count(query_lower)  # Simple frequency score
                })
        
        # Sort by score (descending) and limit results
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:max_results]
    
    def create_chunks(self, text: str, chunk_size: Optional[int] = None, 
                     chunk_overlap: Optional[int] = None) -> List[str]:
        """Split text into overlapping chunks for LLM processing"""
        chunk_size = chunk_size or self.chunk_size
        chunk_overlap = chunk_overlap or self.chunk_overlap
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to end at a sentence boundary
            if end < len(text):
                last_period = chunk.rfind('. ')
                last_newline = chunk.rfind('\n')
                
                # Use the latest sentence/paragraph boundary
                boundary = max(last_period, last_newline)
                if boundary > chunk_size * 0.8:  # Only if we're not losing too much
                    chunk = text[start:start + boundary + 1]
                    end = start + boundary + 1
            
            chunks.append(chunk.strip())
            start = end - chunk_overlap
        
        return chunks
    
    def get_content_for_llm(self, pdf_path: str, page_num: Optional[int] = None,
                           context_pages: int = 1) -> Tuple[str, Dict]:
        """Get content formatted for LLM with metadata"""
        if page_num:
            # Get specific page with context
            start_page = max(1, page_num - context_pages)
            end_page = page_num + context_pages
            content = self.get_page_range_content(pdf_path, start_page, end_page)
            
            metadata = {
                'source': Path(pdf_path).name,
                'pages': f"{start_page}-{end_page}",
                'main_page': page_num
            }
        else:
            # Get summary of the entire document (first few pages)
            content = self.get_page_range_content(pdf_path, 1, 5)
            pages = self.extract_text_from_pdf(pdf_path)
            
            metadata = {
                'source': Path(pdf_path).name,
                'total_pages': len(pages),
                'preview_pages': '1-5'
            }
        
        return content, metadata
    
    def extract_structured_content(self, pdf_path: str, page_num: int) -> Dict:
        """Extract structured content from a page (titles, paragraphs, lists, etc.)"""
        content = self.get_page_content(pdf_path, page_num)
        if not content:
            return {}
        
        # Simple structure detection
        lines = content.split('\n')
        structured = {
            'titles': [],
            'paragraphs': [],
            'lists': [],
            'formulas': []
        }
        
        current_paragraph = []
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_paragraph:
                    structured['paragraphs'].append(' '.join(current_paragraph))
                    current_paragraph = []
                continue
            
            # Detect titles (all caps or numbered sections)
            if line.isupper() or re.match(r'^\d+\.?\s+[A-Z]', line):
                structured['titles'].append(line)
                if current_paragraph:
                    structured['paragraphs'].append(' '.join(current_paragraph))
                    current_paragraph = []
            # Detect list items
            elif re.match(r'^[•\-\*]\s+', line) or re.match(r'^\d+\)\s+', line):
                structured['lists'].append(line)
            # Detect formulas (simple heuristic)
            elif any(char in line for char in ['=', '+', '×', '÷', '²', '³', '√']):
                structured['formulas'].append(line)
            else:
                current_paragraph.append(line)
        
        if current_paragraph:
            structured['paragraphs'].append(' '.join(current_paragraph))
        
        return structured


# Singleton instance
pdf_service = PDFService()