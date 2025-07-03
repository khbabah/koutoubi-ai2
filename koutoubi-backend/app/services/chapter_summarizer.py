"""
Service de génération de résumés de chapitres par AI
"""
import json
import logging
from typing import Dict, List, Any, Optional
from functools import lru_cache
import hashlib
from pathlib import Path
import PyPDF2
import fitz  # PyMuPDF

from app.services.llm_service import llm_service
from app.services.pdf_service import pdf_service

logger = logging.getLogger(__name__)


class ChapterSummarizer:
    def __init__(self):
        self._cache = {}
    
    def extract_chapter_text(self, pdf_path: str, chapter_id: str, start_page: int, end_page: int) -> str:
        """Extrait le texte d'un chapitre du PDF"""
        try:
            doc = fitz.open(pdf_path)
            text = ""
            
            # Extraire le texte des pages du chapitre
            for page_num in range(start_page - 1, min(end_page, len(doc))):
                page = doc[page_num]
                text += f"\n--- Page {page_num + 1} ---\n"
                text += page.get_text()
            
            doc.close()
            return text
            
        except Exception as e:
            logger.error(f"Error extracting chapter text: {str(e)}")
            return ""
    
    def generate_summary_prompt(self, chapter_title: str, chapter_text: str) -> str:
        """Génère le prompt pour l'AI"""
        return f"""Tu es un assistant pédagogique expert en mathématiques. 
Analyse ce chapitre et génère un résumé structuré en JSON.

CHAPITRE: {chapter_title}

CONTENU:
{chapter_text[:3000]}...  # Limité pour éviter les prompts trop longs

INSTRUCTIONS:
1. Génère un résumé concis du chapitre (2-3 phrases)
2. Identifie les sections principales avec leurs concepts clés
3. Extrais les formules importantes
4. Identifie les définitions clés
5. Note les exemples ou exercices types

FORMAT DE SORTIE (JSON strict):
{{
    "summary": "Résumé du chapitre en 2-3 phrases",
    "sections": [
        {{
            "title": "Titre de la section",
            "page": numéro_de_page,
            "key_points": [
                {{"type": "formula", "content": "formule mathématique"}},
                {{"type": "definition", "content": "définition importante"}},
                {{"type": "concept", "content": "concept clé"}},
                {{"type": "example", "content": "exemple illustratif"}},
                {{"type": "tip", "content": "conseil ou astuce"}}
            ]
        }}
    ]
}}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après."""
    
    def parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parse la réponse de l'AI"""
        try:
            # Nettoyer la réponse
            response = response.strip()
            
            # Chercher le JSON dans la réponse
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                return json.loads(json_str)
            else:
                logger.error("No JSON found in AI response")
                return self._get_fallback_summary()
                
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            return self._get_fallback_summary()
    
    def _get_fallback_summary(self) -> Dict[str, Any]:
        """Retourne un résumé par défaut en cas d'erreur"""
        return {
            "summary": "Résumé en cours de génération. Veuillez réessayer.",
            "sections": [
                {
                    "title": "Contenu du chapitre",
                    "page": 1,
                    "key_points": [
                        {"type": "info", "content": "Le résumé détaillé sera bientôt disponible"}
                    ]
                }
            ]
        }
    
    async def generate_chapter_summary(self, pdf_path: str, chapter_id: str, chapter_title: str, 
                               start_page: int, end_page: int) -> Dict[str, Any]:
        """Génère un résumé de chapitre avec l'AI (avec cache)"""
        
        # Vérifier le cache
        cache_key = f"{pdf_path}_{chapter_id}_{start_page}_{end_page}"
        if cache_key in self._cache:
            logger.info(f"Returning cached summary for {chapter_id}")
            return self._cache[cache_key]
        
        try:
            # 1. Extraire le texte du chapitre
            logger.info(f"Extracting text for chapter {chapter_id} (pages {start_page}-{end_page})")
            chapter_text = self.extract_chapter_text(pdf_path, chapter_id, start_page, end_page)
            
            if not chapter_text:
                logger.error("No text extracted from chapter")
                return self._get_fallback_summary()
            
            # 2. Générer le prompt
            prompt = self.generate_summary_prompt(chapter_title, chapter_text)
            
            # 3. Appeler l'AI
            logger.info(f"Generating AI summary for chapter {chapter_id}")
            response = await llm_service.generate_custom_response(
                prompt=prompt,
                system_prompt="Tu es un assistant pédagogique expert. Réponds toujours en JSON valide.",
                max_tokens=1500
            )
            
            # 4. Parser la réponse
            summary_data = self.parse_ai_response(response)
            
            # 5. Formater le résultat final
            result = {
                "chapter_id": chapter_id,
                "title": chapter_title,
                "summary": summary_data.get("summary", ""),
                "sections": summary_data.get("sections", [])
            }
            
            # 6. Mettre en cache
            self._cache[cache_key] = result
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating chapter summary: {str(e)}")
            return {
                "chapter_id": chapter_id,
                "title": chapter_title,
                "summary": "Erreur lors de la génération du résumé",
                "sections": []
            }
    
    def generate_quick_summary(self, pdf_path: str, chapter_id: str, chapter_title: str,
                             start_page: int, end_page: int) -> Dict[str, Any]:
        """Génère un résumé rapide basé sur l'extraction de structure"""
        try:
            # Pour une génération rapide, on peut extraire juste les titres et formules
            doc = fitz.open(pdf_path)
            sections = []
            current_section = None
            
            for page_num in range(start_page - 1, min(end_page, len(doc))):
                page = doc[page_num]
                blocks = page.get_text("dict")
                
                for block in blocks.get("blocks", []):
                    if block.get("type") == 0:  # Text block
                        for line in block.get("lines", []):
                            for span in line.get("spans", []):
                                text = span.get("text", "").strip()
                                if not text:
                                    continue
                                
                                font_size = span.get("size", 12)
                                is_bold = span.get("flags", 0) & 2**4
                                
                                # Détecter les titres de section
                                if font_size > 14 and (is_bold or text.startswith(("1.", "2.", "3."))):
                                    if current_section:
                                        sections.append(current_section)
                                    current_section = {
                                        "title": text,
                                        "page": page_num + 1,
                                        "key_points": []
                                    }
                                
                                # Détecter les formules
                                elif current_section and any(sym in text for sym in ["=", "×", "+", "-", "²"]):
                                    current_section["key_points"].append({
                                        "type": "formula",
                                        "content": text[:100]
                                    })
            
            if current_section:
                sections.append(current_section)
            
            doc.close()
            
            return {
                "chapter_id": chapter_id,
                "title": chapter_title,
                "summary": f"Chapitre sur {chapter_title.lower()} avec {len(sections)} sections principales.",
                "sections": sections[:5]  # Limiter à 5 sections
            }
            
        except Exception as e:
            logger.error(f"Error in quick summary: {str(e)}")
            return self._get_fallback_summary()


# Instance globale
chapter_summarizer = ChapterSummarizer()