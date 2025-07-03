# Plan d'Implémentation Complet - Koutoubi AI

## 🎯 Vision Produit

Application d'apprentissage professionnelle pour les élèves mauritaniens avec :
- **Workflow structuré** : PDF → Learn (Summary, Mindmap, Flashcards, Quiz)
- **Architecture production** : Auth, Offline, Analytics
- **IA intégrée** : Summary intelligent avec cache

## 📋 Fonctionnalités Détaillées

### 1. Mode Learn - 4 Outils

#### 📝 Summary (Feature IA principale)
```
Structure:
- Paragraphes courts (2-3 phrases)
- Mots-clés en gras
- Référence de page (P16, P17)
- Bouton copier par paragraphe

Technique:
- Extraction page par page du PDF
- Génération AI avec Mistral
- Cache Redis (24h)
- Fallback sans IA
```

#### 🧠 Mind Map
```
- Carte mentale interactive du chapitre
- Concepts principaux et relations
- Zoom/pan tactile
- Export image
```

#### 🎴 Flashcards (15 cartes)
```
Structure fixe:
- 5 extraites du PDF
- 5 de Khan Academy
- 5 enrichies par IA

Features:
- Question → Réponse
- Feedback 3 niveaux (Forgot/Remembered/Disable)
- Répétition espacée
- Swipe gestures mobile
```

#### 🎯 Quiz (15 QCM)
```
Features:
- Mots-clés surlignés en jaune
- "Can't remember" pour indices
- Validation avant continuer
- Explications détaillées
- Score et progression
```

## 🏗️ Architecture Technique Complète

### Backend Architecture
```
koutoubi-backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   ├── models/
│   │   ├── user.py
│   │   ├── chapter.py
│   │   ├── flashcard.py
│   │   ├── quiz.py
│   │   └── progress.py
│   ├── schemas/
│   │   └── [pydantic models]
│   ├── api/
│   │   ├── auth.py
│   │   ├── chapters.py
│   │   ├── summary.py      # NEW: AI Summary
│   │   ├── flashcards.py
│   │   ├── quiz.py
│   │   └── progress.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── pdf_processor.py  # NEW: PDF extraction
│   │   ├── summary_service.py # NEW: AI generation
│   │   ├── llm_service.py     # NEW: Mistral integration
│   │   ├── cache_service.py   # NEW: Redis cache
│   │   └── progress_service.py
│   └── middleware/
│       ├── auth.py
│       ├── rate_limit.py
│       └── security.py
├── alembic/           # Database migrations
├── tests/
├── requirements.txt
└── .env
```

### Frontend Architecture
```
koutoubi-frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx        # Protected layout
│   │   ├── page.tsx          # Dashboard
│   │   └── chapters/
│   │       └── [id]/
│   │           ├── page.tsx   # Chapter overview
│   │           ├── learn/
│   │           │   ├── page.tsx
│   │           │   ├── summary/page.tsx    # NEW
│   │           │   ├── mindmap/page.tsx    # NEW
│   │           │   └── layout.tsx
│   │           ├── flashcards/page.tsx
│   │           └── quiz/page.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── learn/
│   │   │   ├── Summary.tsx      # NEW
│   │   │   ├── SummaryPoint.tsx # NEW
│   │   │   ├── MindMap.tsx      # NEW
│   │   │   └── PDFViewer.tsx
│   │   ├── flashcards/
│   │   │   ├── FlashCard.tsx
│   │   │   ├── FlashCardDeck.tsx
│   │   │   └── FeedbackButtons.tsx
│   │   ├── quiz/
│   │   │   ├── QuizQuestion.tsx
│   │   │   ├── QuizResults.tsx
│   │   │   └── KeywordHighlight.tsx
│   │   └── ui/
│   │       └── [Radix UI components]
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOffline.ts
│   │   └── useSummary.ts     # NEW
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── cache.ts          # NEW: IndexedDB
│   │   └── analytics.ts
│   └── providers/
│       ├── AuthProvider.tsx
│       ├── QueryProvider.tsx
│       └── OfflineProvider.tsx
├── public/
│   ├── manifest.json
│   └── sw.js              # Service Worker
├── prisma/
│   └── schema.prisma
└── package.json
```

## 💾 Base de Données Étendue

```sql
-- Table pour les summaries générés
CREATE TABLE chapter_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(id),
    user_id UUID REFERENCES users(id), -- NULL = global
    summary_points JSONB NOT NULL,
    -- Format: [{
    --   "text": "Point de résumé avec **mots en gras**",
    --   "pages": [16, 17],
    --   "keywords": ["administration coloniale"]
    -- }]
    generated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    UNIQUE(chapter_id, user_id)
);

-- Index pour les recherches
CREATE INDEX idx_summaries_chapter ON chapter_summaries(chapter_id);
CREATE INDEX idx_summaries_expiry ON chapter_summaries(expires_at);
```

## 🔄 Workflow Détaillé du Summary

### 1. Extraction PDF
```python
async def extract_chapter_content(chapter_id: str):
    """
    1. Récupère les pages du chapitre (ex: 291-310)
    2. Extrait le texte page par page
    3. Détecte les sections (titres, paragraphes)
    4. Crée des chunks sémantiques
    """
    chapter = await get_chapter(chapter_id)
    
    # PyMuPDF pour extraction précise
    pages_content = []
    doc = fitz.open(chapter.pdf_path)
    
    for page_num in range(chapter.page_start, chapter.page_end + 1):
        page = doc[page_num - 1]
        text = page.get_text()
        
        pages_content.append({
            "page": page_num,
            "text": text,
            "sections": detect_sections(text)
        })
    
    return pages_content
```

### 2. Génération AI du Summary
```python
async def generate_summary(pages_content: List[Dict]):
    """
    Utilise Mistral pour générer les points de résumé
    """
    prompt = """
    Objectif: Créer un résumé pour des élèves de lycée.
    
    Pour chaque page, extrais 2-4 points clés:
    - Chaque point = 2-3 phrases maximum
    - Mets en **gras** les noms propres, dates, concepts importants
    - Reste fidèle au texte original
    - Utilise un langage clair
    
    Page {page_num}:
    {text}
    
    Format de sortie:
    - Point 1 avec **mots importants** en gras
    - Point 2 avec **concepts clés** mis en évidence
    """
    
    summary_points = []
    
    for page_data in pages_content:
        response = await llm_service.generate(
            prompt.format(
                page_num=page_data["page"],
                text=page_data["text"][:2000]  # Limite tokens
            )
        )
        
        points = parse_summary_points(response, page_data["page"])
        summary_points.extend(points)
    
    return summary_points
```

### 3. Component React du Summary
```tsx
// components/learn/Summary.tsx
export function Summary({ chapterId }: { chapterId: string }) {
  const { data: summary, isLoading } = useSummary(chapterId)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const handleCopy = async (point: SummaryPoint) => {
    // Copier le texte sans le formatage
    const plainText = point.text.replace(/\*\*(.*?)\*\*/g, '$1')
    await navigator.clipboard.writeText(plainText)
    
    setCopiedId(point.id)
    setTimeout(() => setCopiedId(null), 2000)
  }
  
  const navigateToPage = (pageNum: number) => {
    // Naviguer vers la page dans le PDF viewer
    window.location.hash = `page=${pageNum}`
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Résumé du chapitre</h2>
      
      <div className="space-y-3">
        {summary?.points.map((point) => (
          <SummaryPoint
            key={point.id}
            point={point}
            onCopy={handleCopy}
            onNavigate={navigateToPage}
            isCopied={copiedId === point.id}
          />
        ))}
      </div>
    </div>
  )
}

// components/learn/SummaryPoint.tsx
export function SummaryPoint({ point, onCopy, onNavigate, isCopied }) {
  return (
    <div className="group flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50">
      {/* Bullet */}
      <div className="mt-2 w-1.5 h-1.5 bg-gray-400 rounded-full" />
      
      {/* Content */}
      <div className="flex-1">
        <p 
          className="text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ 
            __html: formatBoldText(point.text) 
          }}
        />
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Page reference */}
        <button
          onClick={() => onNavigate(point.primaryPage)}
          className="text-xs font-medium text-blue-600 bg-blue-50 
                     px-2 py-1 rounded hover:bg-blue-100"
        >
          P{point.primaryPage}
        </button>
        
        {/* Copy button */}
        <button
          onClick={() => onCopy(point)}
          className="opacity-0 group-hover:opacity-100 p-1.5 
                     hover:bg-gray-100 rounded transition-opacity"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>
    </div>
  )
}
```

## 🚀 Phases de Développement Mises à Jour

### Phase 1: Foundation (Semaine 1)
- [ ] Setup authentication (Supabase)
- [ ] Database schema avec tables summaries
- [ ] API endpoints de base
- [ ] Login/Register UI
- [ ] Protected routes

### Phase 2: Core Features (Semaine 2)
- [ ] PDF viewer avec navigation
- [ ] **Summary AI avec cache Redis**
- [ ] Flashcard system (15 cartes)
- [ ] Quiz avec highlights
- [ ] Progress tracking

### Phase 3: Learn Mode Complet (Semaine 3)
- [ ] Mind map interactif
- [ ] Intégration des 4 outils
- [ ] Offline support (PWA)
- [ ] Background sync
- [ ] Optimisations performance

### Phase 4: Polish & UX (Semaine 4)
- [ ] Animations et transitions
- [ ] Loading states élégants
- [ ] Error handling complet
- [ ] Tests E2E
- [ ] Responsive parfait

### Phase 5: Production (Semaine 5)
- [ ] Deployment (Vercel + AWS)
- [ ] Monitoring (Sentry + PostHog)
- [ ] Documentation
- [ ] Beta testing
- [ ] Launch 🚀

## 📊 Métriques de Succès

### Performance
- Summary generation: < 10s
- Avec cache: < 100ms
- Score Lighthouse: > 90

### Engagement
- Taux de complétion chapitre: > 70%
- Temps moyen par session: > 15min
- Retention J7: > 60%

### Coûts
- Génération summary: ~0.002€/chapitre
- Avec cache hit 80%: ~0.0004€/user/chapitre
- Infrastructure: < 100€/mois pour 1000 users

## 🎯 Prochaines Étapes

1. **Commencer par l'auth** (Supabase)
2. **Implémenter le Summary** (feature différenciante)
3. **Ajouter Flashcards + Quiz**
4. **Finaliser avec Mind Map**
5. **Optimiser et déployer**

C'est un plan complet et professionnel qui intègre tous les éléments analysés !