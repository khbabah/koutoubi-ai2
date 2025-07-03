"""
Version avec cache pour améliorer les performances
"""
from functools import lru_cache
import hashlib
from datetime import datetime, timedelta

# Cache en mémoire pour 1 heure
@lru_cache(maxsize=10)
def get_cached_chapter_pdf(chapter_id: str, pdf_path: str):
    """Cache les PDFs de chapitres extraits"""
    # Le code d'extraction existant
    output_pdf = PyPDF2.PdfWriter()
    # ... extraction ...
    return pdf_bytes

# Ou avec Redis pour un cache partagé
async def get_chapter_pdf_with_redis(chapter_id: str):
    cache_key = f"pdf_chapter:{chapter_id}"
    
    # Vérifier le cache
    cached = await redis_client.get(cache_key)
    if cached:
        return cached
    
    # Sinon, générer et mettre en cache
    pdf_bytes = extract_chapter_pages(chapter_id)
    await redis_client.setex(cache_key, 3600, pdf_bytes)  # Cache 1h
    return pdf_bytes