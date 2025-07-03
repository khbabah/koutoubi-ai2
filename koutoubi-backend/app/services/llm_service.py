"""
LLM Service for Koutoubi AI
Handles all AI operations using Mistral 7B via Ollama
"""
import json
import logging
from typing import Dict, List, Optional, Any
import httpx
from datetime import datetime
import asyncio
from enum import Enum
import re
from html import escape
from app.core.config import settings

logger = logging.getLogger(__name__)

class ActionType(Enum):
    EXPLAIN = "explain"
    QUIZ = "quiz"
    QUESTION = "question"
    REFORMULATE = "reformulate"
    EXERCISE = "exercise"
    SUMMARY = "summary"

class LLMService:
    def __init__(self, ollama_base_url: Optional[str] = None):
        self.base_url = ollama_base_url or settings.OLLAMA_BASE_URL
        self.model = settings.LLM_MODEL
        self.timeout = float(settings.LLM_TIMEOUT)
        self.max_content_length = 10000  # Maximum content length
        self.client = None  # Will be initialized on first use
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client with connection pooling"""
        if self.client is None:
            self.client = httpx.AsyncClient(timeout=self.timeout)
        return self.client
    
    def _sanitize_input(self, text: str) -> str:
        """Sanitize input to prevent injection attacks"""
        if not text:
            return ""
        
        # Limit length
        text = text[:self.max_content_length]
        
        # Remove potential injection patterns
        text = text.replace("\\", "\\\\")
        text = text.replace('"', '\\"')
        text = text.replace('\n', ' ')
        text = text.replace('\r', ' ')
        
        # Remove any control characters
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
        
        return text.strip()
        
    async def _call_ollama(self, prompt: str, system_prompt: str = "", max_tokens: int = 1000) -> str:
        """Make a request to Ollama API"""
        try:
            # Sanitize inputs
            prompt = self._sanitize_input(prompt)
            system_prompt = self._sanitize_input(system_prompt)
            
            client = await self._get_client()
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                        "model": self.model,
                        "prompt": prompt,
                        "system": system_prompt,
                        "stream": False,
                        "options": {
                            "num_predict": max_tokens,
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "repeat_penalty": 1.1,  # Reduce repetition
                            "stop": []  # Don't stop early
                        }
                },
                timeout=self.timeout
            )
            response.raise_for_status()
            result = response.json()
            response_text = result.get("response", "")
            
            # Check if response was truncated
            if response_text and len(response_text) > 50:
                if response_text[-1] not in '.!?\n"\')' and 'done' in result and result['done']:
                    logger.warning(f"Response may be truncated. Length: {len(response_text)} chars")
            
            return response_text
        except httpx.TimeoutException:
            logger.error(f"Ollama request timed out after {self.timeout}s")
            raise Exception("LLM request timed out. Please try again.")
        except Exception as e:
            logger.error(f"Error calling Ollama: {str(e)}")
            raise Exception(f"LLM service error: {str(e)}")

    def _extract_json(self, response: str) -> dict:
        """Robustly extract JSON from LLM response"""
        # Try to find JSON block using regex
        json_patterns = [
            r'\{[^{}]*\}',  # Simple JSON object
            r'\{(?:[^{}]|\{[^{}]*\})*\}',  # Nested JSON object
            r'\{.*\}',  # Greedy match as fallback
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, response, re.DOTALL)
            for match in matches:
                try:
                    return json.loads(match)
                except json.JSONDecodeError:
                    continue
        
        # If no valid JSON found, try to extract from response
        json_start = response.find("{")
        json_end = response.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            try:
                return json.loads(response[json_start:json_end])
            except json.JSONDecodeError:
                pass
        
        raise ValueError("No valid JSON found in response")
    
    async def explain_content(self, content: str, context: Optional[str] = None) -> str:
        """Generate an explanation for the given content"""
        system_prompt = """Tu es un tuteur éducatif expert pour les élèves mauritaniens. 
        Explique les concepts de manière claire et pédagogique en français.
        Utilise des exemples pertinents pour le contexte mauritanien quand c'est possible."""
        
        prompt = f"""Explique ce contenu de manière claire et détaillée pour un élève:

Contenu: {content}

{f"Contexte du chapitre: {context}" if context else ""}

Fournis une explication structurée avec:
1. Une introduction simple
2. Les points clés à comprendre
3. Des exemples concrets
4. Un résumé des points importants"""

        return await self._call_ollama(prompt, system_prompt, max_tokens=1500)

    async def generate_quiz(self, content: str, num_questions: int = 5, difficulty: str = "medium") -> Dict[str, Any]:
        """Generate quiz questions based on content"""
        system_prompt = """Tu es un créateur de quiz expert pour l'éducation mauritanienne.
        Crée des questions QCM pertinentes et éducatives en français.
        Les questions doivent tester la compréhension, pas juste la mémorisation."""
        
        difficulty_map = {
            "easy": "faciles (concepts de base)",
            "medium": "moyennes (compréhension approfondie)",
            "hard": "difficiles (analyse et application)"
        }
        
        prompt = f"""Génère {num_questions} questions QCM {difficulty_map.get(difficulty, 'moyennes')} basées sur ce contenu:

{content}

Pour chaque question, fournis EXACTEMENT ce format JSON:
{{
    "questions": [
        {{
            "id": 1,
            "question": "La question ici",
            "choices": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0,
            "explanation": "Explication de la bonne réponse"
        }}
    ]
}}

Les indices correct_answer doivent être 0, 1, 2 ou 3."""

        response = await self._call_ollama(prompt, system_prompt, max_tokens=2000)
        
        try:
            return self._extract_json(response)
        except Exception as e:
            logger.error(f"Error parsing quiz JSON: {str(e)}")
            # Return a default quiz structure
            return {
                "questions": [
                    {
                        "id": 1,
                        "question": "Question par défaut - Erreur de génération",
                        "choices": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": 0,
                        "explanation": "Désolé, une erreur s'est produite lors de la génération du quiz."
                    }
                ]
            }

    async def answer_question(self, question: str, content: str, context: Optional[str] = None) -> str:
        """Answer a specific question about the content"""
        system_prompt = """Tu es un tuteur expert qui répond aux questions des élèves mauritaniens.
        Réponds de manière précise, claire et pédagogique en français.
        Base tes réponses sur le contenu fourni."""
        
        prompt = f"""Réponds à cette question d'un élève:

Question: {question}

Contenu de référence: {content}

{f"Contexte: {context}" if context else ""}

Fournis une réponse complète et structurée qui aide l'élève à comprendre."""

        return await self._call_ollama(prompt, system_prompt, max_tokens=1000)

    async def reformulate_content(self, content: str, style: str = "simple") -> str:
        """Reformulate content in different styles"""
        styles = {
            "simple": "Reformule ce texte de manière très simple pour un élève débutant",
            "detailed": "Reformule ce texte avec plus de détails et d'explications",
            "summary": "Résume ce texte en gardant les points essentiels",
            "examples": "Reformule ce texte en ajoutant des exemples concrets"
        }
        
        system_prompt = """Tu es un expert en reformulation pédagogique pour l'éducation mauritanienne.
        Adapte le contenu au niveau et au style demandé."""
        
        prompt = f"""{styles.get(style, styles['simple'])}:

{content}

Garde le sens original mais adapte la forme selon le style demandé."""

        return await self._call_ollama(prompt, system_prompt, max_tokens=1200)

    async def generate_custom_response(self, prompt: str, system_prompt: str = "", max_tokens: int = 1500) -> str:
        """Generate a custom response for any prompt"""
        if not system_prompt:
            system_prompt = "Tu es un assistant AI expert et pédagogue."
        
        return await self._call_ollama(prompt, system_prompt, max_tokens)
    
    def generate_response(self, prompt: str, system_prompt: str = "", max_tokens: int = 1500) -> str:
        """Synchronous wrapper for generate_custom_response"""
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(
                self.generate_custom_response(prompt, system_prompt, max_tokens)
            )
        finally:
            loop.close()
    
    async def generate_exercise(self, content: str, exercise_type: str = "problem", difficulty: str = "medium") -> Dict[str, Any]:
        """Generate exercises based on content"""
        system_prompt = """Tu es un créateur d'exercices expert pour l'éducation mauritanienne.
        Crée des exercices pertinents et progressifs en français."""
        
        exercise_types = {
            "problem": "un problème à résoudre",
            "application": "un exercice d'application",
            "analysis": "un exercice d'analyse"
        }
        
        prompt = f"""Crée {exercise_types.get(exercise_type, 'un exercice')} de niveau {difficulty} basé sur:

{content}

Fournis EXACTEMENT ce format JSON:
{{
    "title": "Titre de l'exercice",
    "statement": "Énoncé détaillé de l'exercice",
    "hints": ["Indice 1", "Indice 2", "Indice 3"],
    "solution": "Solution détaillée étape par étape",
    "difficulty": "{difficulty}",
    "type": "{exercise_type}"
}}"""

        response = await self._call_ollama(prompt, system_prompt, max_tokens=1500)
        
        try:
            return self._extract_json(response)
        except Exception as e:
            logger.error(f"Error parsing exercise JSON: {str(e)}")
            return {
                "title": "Exercice",
                "statement": "Erreur lors de la génération de l'exercice",
                "hints": ["Réessayez plus tard"],
                "solution": "Non disponible",
                "difficulty": difficulty,
                "type": exercise_type
            }

    async def generate_summary(self, content: str, max_points: int = 5) -> List[str]:
        """Generate a summary with key points"""
        system_prompt = """Tu es un expert en résumé pédagogique pour l'éducation mauritanienne.
        Extrais les points clés les plus importants pour les élèves."""
        
        prompt = f"""Résume ce contenu en {max_points} points clés pour un élève:

{content}

Fournis une liste de points concis et clairs, chaque point sur une ligne commençant par "- "."""

        response = await self._call_ollama(prompt, system_prompt, max_tokens=2000)  # Increased for complete summaries
        
        # Parse bullet points
        points = []
        for line in response.split('\n'):
            line = line.strip()
            if line.startswith('- ') or line.startswith('• '):
                points.append(line[2:].strip())
            elif line and len(points) < max_points and not line.startswith(('*', '#')):
                points.append(line)
        
        return points[:max_points] if points else ["Résumé non disponible"]
    
    async def generate_page_summary(self, content: str, page_number: int) -> Dict[str, Any]:
        """Generate a complete summary paragraph for a single page"""
        system_prompt = """Tu es un expert en résumé pédagogique pour l'éducation mauritanienne.
        Crée des résumés complets et utiles pour les élèves.
        IMPORTANT: Fournis un résumé COMPLET sans le tronquer."""
        
        prompt = f"""Résume le contenu de la page {page_number} en un paragraphe complet et informatif.

Contenu de la page:
{content[:2000]}  # Limit input to avoid overwhelming the model

Le résumé doit:
1. Capturer TOUS les concepts principaux de la page
2. Être écrit en un paragraphe fluide de 100-150 mots
3. Être utile pour un élève qui révise
4. Ne PAS être tronqué ou coupé

Résumé complet:"""

        summary_text = await self._call_ollama(prompt, system_prompt, max_tokens=3000)  # Large limit to avoid truncation
        
        # Extract key concepts for tags
        keywords_prompt = f"Liste 3-5 mots-clés importants de ce texte, séparés par des virgules: {summary_text[:300]}"
        keywords_response = await self._call_ollama(keywords_prompt, "", max_tokens=100)
        keywords = [k.strip() for k in keywords_response.split(',') if k.strip()][:5]
        
        return {
            "page_number": page_number,
            "summary": summary_text.strip(),
            "keywords": keywords,
            "word_count": len(summary_text.split()),
            "is_complete": not (summary_text and summary_text[-1] not in '.!?\n')
        }

    async def process_action(self, action_type: ActionType, content: str, **kwargs) -> Any:
        """Process different types of AI actions"""
        try:
            if action_type == ActionType.EXPLAIN:
                return await self.explain_content(content, kwargs.get('context'))
            
            elif action_type == ActionType.QUIZ:
                return await self.generate_quiz(
                    content, 
                    kwargs.get('num_questions', 5),
                    kwargs.get('difficulty', 'medium')
                )
            
            elif action_type == ActionType.QUESTION:
                return await self.answer_question(
                    kwargs.get('question', ''),
                    content,
                    kwargs.get('context')
                )
            
            elif action_type == ActionType.REFORMULATE:
                return await self.reformulate_content(
                    content,
                    kwargs.get('style', 'simple')
                )
            
            elif action_type == ActionType.EXERCISE:
                return await self.generate_exercise(
                    content,
                    kwargs.get('exercise_type', 'problem'),
                    kwargs.get('difficulty', 'medium')
                )
            
            elif action_type == ActionType.SUMMARY:
                return await self.generate_summary(
                    content,
                    kwargs.get('max_points', 5)
                )
            
            else:
                raise ValueError(f"Unknown action type: {action_type}")
                
        except Exception as e:
            logger.error(f"Error processing {action_type}: {str(e)}")
            raise

    async def check_ollama_health(self) -> bool:
        """Check if Ollama is running and model is available"""
        try:
            async with httpx.AsyncClient() as client:
                # Check if Ollama is running
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                
                # Check if our model is available
                models = response.json().get('models', [])
                model_names = [m.get('name', '') for m in models]
                
                if self.model not in model_names:
                    logger.warning(f"Model {self.model} not found. Available models: {model_names}")
                    return False
                    
                return True
        except Exception as e:
            logger.error(f"Ollama health check failed: {str(e)}")
            return False

    async def close(self):
        """Close the HTTP client"""
        if self.client:
            await self.client.aclose()
            self.client = None

# Singleton instance
llm_service = LLMService()