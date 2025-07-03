# Système de Summary AI - Koutoubi AI

## 📝 Structure du Summary (D'après la capture)

### Format Observé
- **Paragraphes courts** : Chaque point clé est un paragraphe distinct
- **Référence de page** : Tag bleu "P16", "P17", "P18" à droite
- **Icône de copie** : 📋 pour copier le paragraphe
- **Points clés en gras** : Mots importants mis en évidence
- **Structure hiérarchique** : Titres de sections (ex: "g. La rupture entre les deux parties ?")

## 🤖 Architecture du Système de Summary

### 1. Extraction et Chunking du PDF

```python
# services/pdf_processor.py
from typing import List, Dict
import fitz  # PyMuPDF
from langchain.text_splitter import RecursiveCharacterTextSplitter

class PDFProcessor:
    def extract_pages_with_metadata(self, pdf_path: str, start_page: int, end_page: int) -> List[Dict]:
        """
        Extrait le texte page par page avec métadonnées
        """
        doc = fitz.open(pdf_path)
        pages_data = []
        
        for page_num in range(start_page - 1, end_page):
            page = doc[page_num]
            text = page.get_text()
            
            pages_data.append({
                "page_number": page_num + 1,
                "text": text,
                "char_count": len(text),
                "has_images": len(page.get_images()) > 0
            })
        
        return pages_data
    
    def chunk_by_semantic_sections(self, pages_data: List[Dict]) -> List[Dict]:
        """
        Découpe le texte en sections sémantiques
        """
        chunks = []
        current_chunk = ""
        current_pages = []
        
        # Patterns pour détecter les sections
        section_patterns = [
            r'^\d+\.',  # 1. Section
            r'^[a-z]\.',  # a. Sous-section
            r'^•',  # Bullet points
            r'^-',  # Tirets
        ]
        
        for page_data in pages_data:
            lines = page_data["text"].split('\n')
            
            for line in lines:
                # Détecter nouveau paragraphe/section
                if any(re.match(pattern, line.strip()) for pattern in section_patterns):
                    if current_chunk:
                        chunks.append({
                            "text": current_chunk.strip(),
                            "pages": list(set(current_pages)),
                            "type": self._detect_chunk_type(current_chunk)
                        })
                    current_chunk = line
                    current_pages = [page_data["page_number"]]
                else:
                    current_chunk += " " + line
                    if page_data["page_number"] not in current_pages:
                        current_pages.append(page_data["page_number"])
        
        return chunks
```

### 2. Génération du Summary avec LLM

```python
# services/summary_service.py
from typing import List, Dict
import asyncio
from langchain.schema import HumanMessage, SystemMessage

class SummaryService:
    def __init__(self, llm_service):
        self.llm = llm_service
        self.summary_prompt = """
        Tu es un assistant éducatif spécialisé dans la création de résumés pour des élèves.
        
        Consignes:
        1. Extrais les points clés les plus importants
        2. Chaque point doit être un paragraphe court (2-3 phrases max)
        3. Mets en gras les concepts/noms/dates importantes avec **texte**
        4. Reste fidèle au texte original
        5. Utilise un langage clair et accessible
        
        Format attendu:
        - Un point clé par paragraphe
        - Commence par l'idée principale
        - Ajoute les détails importants
        
        Texte à résumer:
        {text}
        """
    
    async def generate_summary_points(self, chunks: List[Dict]) -> List[Dict]:
        """
        Génère des points de résumé pour chaque chunk
        """
        summary_points = []
        
        # Traiter par batch pour optimiser
        batch_size = 5
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            
            # Générer les résumés en parallèle
            tasks = []
            for chunk in batch:
                task = self._summarize_chunk(chunk)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks)
            summary_points.extend(results)
        
        return summary_points
    
    async def _summarize_chunk(self, chunk: Dict) -> Dict:
        """
        Résume un chunk individuel
        """
        messages = [
            SystemMessage(content=self.summary_prompt.format(text=chunk["text"]))
        ]
        
        response = await self.llm.agenerate([messages])
        summary_text = response.generations[0][0].text
        
        # Parser les points clés
        points = self._parse_summary_points(summary_text)
        
        return {
            "original_chunk": chunk,
            "summary_points": points,
            "pages": chunk["pages"]
        }
    
    def _parse_summary_points(self, summary_text: str) -> List[str]:
        """
        Parse le texte en points individuels
        """
        # Séparer par double saut de ligne ou bullet points
        points = re.split(r'\n\n|(?=^[•\-\*])', summary_text.strip())
        
        # Nettoyer et filtrer
        cleaned_points = []
        for point in points:
            point = point.strip()
            if len(point) > 20:  # Ignorer les points trop courts
                # Formatter le texte en gras
                point = self._format_bold_text(point)
                cleaned_points.append(point)
        
        return cleaned_points
    
    def _format_bold_text(self, text: str) -> str:
        """
        Détecte et formate les éléments importants en gras
        """
        # Patterns pour les éléments importants
        patterns = [
            (r'\b(\d{4})\b', r'**\1**'),  # Dates
            (r'\b([A-Z][a-z]+ [A-Z][a-z]+)\b', r'**\1**'),  # Noms propres
            (r'"([^"]+)"', r'**"\1"**'),  # Citations
        ]
        
        for pattern, replacement in patterns:
            text = re.sub(pattern, replacement, text)
        
        return text
```

### 3. API Endpoint pour le Summary

```python
# routes/summary.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List

router = APIRouter()

@router.get("/api/chapters/{chapter_id}/summary")
async def get_chapter_summary(
    chapter_id: str,
    current_user: User = Depends(get_current_user),
    cache: Redis = Depends(get_redis)
):
    # Vérifier le cache
    cache_key = f"summary:chapter:{chapter_id}:user:{current_user.id}"
    cached_summary = await cache.get(cache_key)
    
    if cached_summary:
        return json.loads(cached_summary)
    
    # Récupérer les infos du chapitre
    chapter = await db.chapters.find_one({"id": chapter_id})
    if not chapter:
        raise HTTPException(404, "Chapter not found")
    
    # Extraire et traiter le PDF
    pdf_processor = PDFProcessor()
    pages_data = pdf_processor.extract_pages_with_metadata(
        chapter["pdf_path"],
        chapter["page_start"],
        chapter["page_end"]
    )
    
    chunks = pdf_processor.chunk_by_semantic_sections(pages_data)
    
    # Générer le summary
    summary_service = SummaryService(llm_service)
    summary_points = await summary_service.generate_summary_points(chunks)
    
    # Formatter la réponse
    formatted_summary = format_summary_response(summary_points)
    
    # Mettre en cache (24h)
    await cache.setex(cache_key, 86400, json.dumps(formatted_summary))
    
    return formatted_summary

def format_summary_response(summary_points: List[Dict]) -> Dict:
    """
    Formate les points de résumé pour l'API
    """
    formatted_points = []
    
    for item in summary_points:
        for point in item["summary_points"]:
            formatted_points.append({
                "id": str(uuid.uuid4()),
                "text": point,
                "pages": item["pages"],
                "primary_page": item["pages"][0] if item["pages"] else None
            })
    
    return {
        "summary_points": formatted_points,
        "total_points": len(formatted_points),
        "generated_at": datetime.utcnow().isoformat()
    }
```

### 4. Frontend Component

```tsx
// components/Summary.tsx
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface SummaryPoint {
  id: string
  text: string
  pages: number[]
  primary_page: number
}

export function Summary({ chapterId }: { chapterId: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const { data, isLoading } = useQuery({
    queryKey: ['summary', chapterId],
    queryFn: () => api.get(`/chapters/${chapterId}/summary`),
    staleTime: 1000 * 60 * 60, // 1 hour
  })
  
  const handleCopy = async (point: SummaryPoint) => {
    await navigator.clipboard.writeText(point.text)
    setCopiedId(point.id)
    setTimeout(() => setCopiedId(null), 2000)
  }
  
  const formatText = (text: string) => {
    // Convertir **text** en <strong>text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }
  
  if (isLoading) {
    return <SummarySkeleton />
  }
  
  return (
    <div className="space-y-4 p-6">
      {data?.summary_points.map((point: SummaryPoint) => (
        <div 
          key={point.id} 
          className="group flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {/* Bullet point */}
          <div className="mt-1.5 w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
          
          {/* Content */}
          <div className="flex-1">
            <p 
              className="text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatText(point.text) }}
            />
          </div>
          
          {/* Page ref and copy button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              P{point.primary_page}
            </span>
            
            <button
              onClick={() => handleCopy(point)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded"
              title="Copier"
            >
              {copiedId === point.id ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## 🔧 Optimisations Importantes

### 1. Mise en Cache Intelligente

```python
class SummaryCacheStrategy:
    def __init__(self, redis_client):
        self.redis = redis_client
        
    async def get_or_generate(self, chapter_id: str, user_id: str):
        # Cache multi-niveau
        # 1. Cache utilisateur (personnalisé)
        user_key = f"summary:user:{user_id}:chapter:{chapter_id}"
        
        # 2. Cache global (partagé)
        global_key = f"summary:global:chapter:{chapter_id}"
        
        # Vérifier d'abord le cache utilisateur
        cached = await self.redis.get(user_key)
        if cached:
            return json.loads(cached)
        
        # Puis le cache global
        cached = await self.redis.get(global_key)
        if cached:
            # Copier vers le cache utilisateur
            await self.redis.setex(user_key, 3600, cached)
            return json.loads(cached)
        
        return None
```

### 2. Streaming pour Gros Documents

```python
async def stream_summary_generation(chunks: List[Dict]):
    """
    Génère le summary en streaming pour une meilleure UX
    """
    async for chunk_summary in generate_summaries_stream(chunks):
        yield {
            "type": "summary_point",
            "data": chunk_summary
        }
```

### 3. Fallback sans IA

```python
def generate_basic_summary(text: str) -> List[str]:
    """
    Génère un résumé basique sans IA (fallback)
    """
    # Extraire les phrases avec patterns importants
    important_patterns = [
        r'[A-Z][^.!?]*(?:important|essentiel|principal|clé)[^.!?]*[.!?]',
        r'[A-Z][^.!?]*(?:définit|appelle|nomme)[^.!?]*[.!?]',
        r'[A-Z][^.!?]*(?:\d{4})[^.!?]*[.!?]',  # Dates
    ]
    
    summary_points = []
    for pattern in important_patterns:
        matches = re.findall(pattern, text)
        summary_points.extend(matches[:2])  # Max 2 par pattern
    
    return summary_points[:10]  # Max 10 points
```

## 📊 Coût et Performance

### Estimation des Coûts
- **Tokens moyens par chapitre** : ~5,000 tokens
- **Coût Mistral 7B** : ~0.002€ par chapitre
- **Avec cache** : Coût divisé par nombre d'utilisateurs

### Métriques de Performance
- **Temps de génération** : 5-10 secondes par chapitre
- **Avec cache** : <100ms
- **Taux de cache hit** : ~80% après 1 semaine

## 🎯 Points Clés de l'Implémentation

1. **Extraction intelligente** : Découpage par sections sémantiques
2. **Prompt optimisé** : Instructions claires pour le format souhaité
3. **Cache multi-niveau** : User + Global
4. **Format cohérent** : Points courts avec page de référence
5. **Fallback** : Résumé basique si l'IA n'est pas disponible