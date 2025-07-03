"""
Script de génération du contenu avec Claude (via interface web)
Génère les prompts et structure pour traiter 200 PDFs efficacement
"""
import os
import json
from pathlib import Path
import PyPDF2
import fitz
from datetime import datetime
import sqlite3
import hashlib

class ClaudeContentGenerator:
    def __init__(self):
        self.output_dir = Path("./content/claude_generation")
        self.output_dir.mkdir(exist_ok=True)
        self.db_path = Path("./koutoubi_content.db")
        self.setup_database()
    
    def setup_database(self):
        """Créer la base de données pour stocker le contenu"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS generated_content (
            id INTEGER PRIMARY KEY,
            pdf_name TEXT,
            pdf_hash TEXT,
            chapter_num INTEGER,
            chapter_title TEXT,
            content_type TEXT,  -- summary, flashcards, quiz
            content_json TEXT,
            generated_at TIMESTAMP,
            validated BOOLEAN DEFAULT 0,
            UNIQUE(pdf_name, chapter_num, content_type)
        )
        """)
        
        conn.commit()
        conn.close()
    
    def extract_chapters_from_pdf(self, pdf_path: Path) -> list:
        """Extraire les chapitres d'un PDF"""
        doc = fitz.open(str(pdf_path))
        chapters = []
        current_chapter = None
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            # Détecter les débuts de chapitre
            lines = text.split('\n')
            for line in lines:
                if any(marker in line.upper() for marker in ['CHAPITRE', 'CHAPTER', 'الفصل']):
                    if current_chapter:
                        chapters.append(current_chapter)
                    
                    current_chapter = {
                        'number': len(chapters) + 1,
                        'title': line.strip(),
                        'start_page': page_num,
                        'content': text,
                        'pages': [page_num]
                    }
                elif current_chapter and page_num not in current_chapter['pages']:
                    current_chapter['content'] += '\n\n' + text
                    current_chapter['pages'].append(page_num)
        
        if current_chapter:
            chapters.append(current_chapter)
        
        doc.close()
        return chapters
    
    def generate_master_prompt(self, pdf_name: str, chapter: dict) -> dict:
        """Générer le prompt maître pour Claude"""
        
        prompt = f"""Tu es un expert pédagogue créant du contenu éducatif pour des lycéens mauritaniens.

PDF: {pdf_name}
Chapitre {chapter['number']}: {chapter['title']}
Pages: {chapter['pages'][0]}-{chapter['pages'][-1]}

CONTENU DU CHAPITRE:
{chapter['content'][:8000]}  # Limiter pour Claude

TÂCHE: Génère TOUT le contenu éducatif pour ce chapitre en une seule fois.

INSTRUCTIONS DÉTAILLÉES:

1. RÉSUMÉ STRUCTURÉ
- Résumé global (3-4 phrases)
- 3-5 sections principales avec:
  - Concepts clés
  - Formules importantes
  - Définitions essentielles
  - Points à retenir

2. FLASHCARDS (15-20 cartes)
Types variés:
- Définitions (Qu'est-ce que X?)
- Formules (Comment calculer Y?)
- Applications (Dans quel cas utilise-t-on Z?)
- Concepts (Expliquez le principe de W)

3. QUIZ QCM (10-15 questions)
- Difficulté progressive
- 4 choix par question
- Explications détaillées
- Mix : compréhension, application, analyse

FORMAT DE SORTIE (JSON STRICT):
```json
{{
  "summary": {{
    "global": "Résumé en 3-4 phrases",
    "sections": [
      {{
        "title": "Nom de la section",
        "concepts": ["concept1", "concept2"],
        "formulas": [{{"name": "nom", "formula": "expression", "usage": "quand l'utiliser"}}],
        "definitions": [{{"term": "terme", "definition": "définition"}}],
        "key_points": ["point1", "point2"]
      }}
    ]
  }},
  "flashcards": [
    {{
      "id": 1,
      "type": "definition|formula|concept|application",
      "difficulty": "easy|medium|hard",
      "question": "Question ici",
      "answer": "Réponse détaillée",
      "hint": "Indice optionnel"
    }}
  ],
  "quiz": [
    {{
      "id": 1,
      "question": "Question complète",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Explication détaillée de pourquoi c'est la bonne réponse",
      "difficulty": "easy|medium|hard",
      "topic": "Sous-thème abordé"
    }}
  ]
}}
```

IMPORTANT:
- Tout en français
- Adapté au niveau lycée
- Exemples concrets et locaux quand possible
- Formules mathématiques en LaTeX si nécessaire
- Réponse UNIQUEMENT en JSON valide"""

        return {
            'prompt': prompt,
            'chapter_info': {
                'number': chapter['number'],
                'title': chapter['title'],
                'pages': len(chapter['pages'])
            }
        }
    
    def create_batch_prompts(self, pdf_dir: Path):
        """Créer tous les prompts pour traitement par batch"""
        all_prompts = []
        pdf_files = list(pdf_dir.glob("*.pdf"))
        
        print(f"📚 Traitement de {len(pdf_files)} PDFs")
        
        for pdf_path in pdf_files:
            print(f"\n📄 {pdf_path.name}")
            
            # Calculer le hash du PDF
            pdf_hash = hashlib.md5(pdf_path.read_bytes()).hexdigest()
            
            # Extraire les chapitres
            chapters = self.extract_chapters_from_pdf(pdf_path)
            print(f"   → {len(chapters)} chapitres trouvés")
            
            # Générer les prompts pour chaque chapitre
            for chapter in chapters:
                prompt_data = self.generate_master_prompt(pdf_path.name, chapter)
                prompt_data['pdf_info'] = {
                    'name': pdf_path.name,
                    'hash': pdf_hash,
                    'chapter_num': chapter['number']
                }
                all_prompts.append(prompt_data)
        
        # Sauvegarder les prompts
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        prompts_file = self.output_dir / f"prompts_batch_{timestamp}.json"
        
        with open(prompts_file, 'w', encoding='utf-8') as f:
            json.dump({
                'total_prompts': len(all_prompts),
                'created_at': timestamp,
                'prompts': all_prompts
            }, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ {len(all_prompts)} prompts générés")
        print(f"📄 Fichier: {prompts_file}")
        
        # Créer aussi des fichiers individuels pour faciliter le traitement
        batch_dir = self.output_dir / f"batch_{timestamp}"
        batch_dir.mkdir(exist_ok=True)
        
        for i, prompt_data in enumerate(all_prompts):
            prompt_file = batch_dir / f"prompt_{i+1:04d}_{prompt_data['pdf_info']['name']}_ch{prompt_data['pdf_info']['chapter_num']}.txt"
            with open(prompt_file, 'w', encoding='utf-8') as f:
                f.write(prompt_data['prompt'])
        
        print(f"📁 Prompts individuels dans: {batch_dir}")
        
        return prompts_file
    
    def save_claude_response(self, pdf_name: str, chapter_num: int, content_type: str, content: dict):
        """Sauvegarder la réponse de Claude dans la base de données"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
        INSERT OR REPLACE INTO generated_content 
        (pdf_name, chapter_num, chapter_title, content_type, content_json, generated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            pdf_name,
            chapter_num,
            content.get('chapter_title', f'Chapitre {chapter_num}'),
            content_type,
            json.dumps(content, ensure_ascii=False),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
    
    def create_import_script(self):
        """Créer un script pour importer les réponses de Claude"""
        script_content = '''"""
Script pour importer les réponses de Claude
Utilisation: python import_claude_responses.py <dossier_reponses>
"""
import sys
import json
from pathlib import Path
import sqlite3

def import_responses(responses_dir: Path):
    db = sqlite3.connect("koutoubi_content.db")
    cursor = db.cursor()
    
    response_files = list(responses_dir.glob("*.json"))
    print(f"Importation de {len(response_files)} réponses...")
    
    for response_file in response_files:
        with open(response_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extraire les infos du nom de fichier
        # Format: response_0001_math_ch1.json
        parts = response_file.stem.split('_')
        pdf_name = parts[2]
        chapter_num = int(parts[3].replace('ch', ''))
        
        # Sauvegarder chaque type de contenu
        if 'summary' in data:
            cursor.execute("""
            INSERT OR REPLACE INTO generated_content 
            (pdf_name, chapter_num, content_type, content_json, generated_at)
            VALUES (?, ?, 'summary', ?, datetime('now'))
            """, (pdf_name, chapter_num, json.dumps(data['summary'])))
        
        if 'flashcards' in data:
            cursor.execute("""
            INSERT OR REPLACE INTO generated_content 
            (pdf_name, chapter_num, content_type, content_json, generated_at)
            VALUES (?, ?, 'flashcards', ?, datetime('now'))
            """, (pdf_name, chapter_num, json.dumps(data['flashcards'])))
        
        if 'quiz' in data:
            cursor.execute("""
            INSERT OR REPLACE INTO generated_content 
            (pdf_name, chapter_num, content_type, content_json, generated_at)
            VALUES (?, ?, 'quiz', ?, datetime('now'))
            """, (pdf_name, chapter_num, json.dumps(data['quiz'])))
        
        print(f"✅ Importé: {response_file.name}")
    
    db.commit()
    db.close()
    print(f"\\n✅ {len(response_files)} réponses importées avec succès!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_claude_responses.py <dossier_reponses>")
        sys.exit(1)
    
    import_responses(Path(sys.argv[1]))
'''
        
        script_path = self.output_dir / "import_claude_responses.py"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        print(f"✅ Script d'import créé: {script_path}")


def generate_workflow_guide():
    """Générer un guide détaillé du workflow"""
    guide = """# 📚 Guide de Génération du Contenu avec Claude

## Workflow Complet

### 1. Préparation (5 minutes)
```bash
# Organiser vos PDFs
mkdir -p content/pdfs
# Copier tous vos PDFs dans content/pdfs/

# Lancer la génération des prompts
python scripts/generate_with_claude.py
```

### 2. Génération avec Claude (2-3 heures pour 200 PDFs)

#### Option A : Traitement par batch
1. Ouvrir le dossier des prompts générés
2. Dans Claude :
   - Copier-coller chaque prompt
   - Attendre la réponse JSON
   - Sauvegarder dans `content/claude_responses/response_XXXX_pdfname_chX.json`

#### Option B : Automatisation avec Claude API (si disponible)
```python
# Si vous avez accès à l'API Claude
for prompt in prompts:
    response = claude.complete(prompt)
    save_response(response)
```

### 3. Validation avec ChatGPT (1 heure)

Prompt de validation :
```
Voici du contenu éducatif généré. Vérifie :
1. La précision des informations
2. La clarté pédagogique
3. La cohérence des quiz
4. Suggère des améliorations

[Coller le JSON de Claude]
```

### 4. Import dans l'application
```bash
python import_claude_responses.py content/claude_responses/
```

### 5. Intégration finale
- Les données sont maintenant dans SQLite
- L'application charge depuis la base de données
- Pas de génération en temps réel

## Astuces pour Efficacité

### Traitement par lots
- Grouper 10 chapitres par session Claude
- Utiliser des templates cohérents
- Sauvegarder régulièrement

### Prompts optimisés
- Inclure des exemples dans le premier prompt
- Réutiliser les formats qui fonctionnent bien
- Ajuster selon la matière

### Validation rapide
- Focus sur les erreurs factuelles
- Vérifier les formules mathématiques
- Tester quelques quiz manuellement

## Estimation de temps

| Étape | Temps | Détails |
|-------|-------|---------|
| Extraction | 30 min | Automatique |
| Génération Claude | 2-3h | ~1 min par chapitre |
| Validation | 1h | Échantillonnage |
| Import | 10 min | Automatique |
| **Total** | **4-5h** | Pour 200 PDFs |

## Structure finale

```
koutoubi_content.db
├── summaries (800+ entrées)
├── flashcards (12,000+ cartes)
└── quiz_questions (8,000+ questions)
```

## Commandes utiles

```bash
# Vérifier le contenu généré
sqlite3 koutoubi_content.db "SELECT COUNT(*) FROM generated_content;"

# Exporter en JSON pour backup
python export_to_json.py

# Nettoyer et recommencer
rm koutoubi_content.db && python generate_with_claude.py
```
"""
    
    with open("WORKFLOW_CLAUDE_GENERATION.md", "w", encoding="utf-8") as f:
        f.write(guide)
    
    print("📄 Guide créé: WORKFLOW_CLAUDE_GENERATION.md")


if __name__ == "__main__":
    print("🚀 Préparation de la génération du contenu avec Claude")
    
    # 1. Créer le générateur
    generator = ClaudeContentGenerator()
    
    # 2. Générer tous les prompts
    pdf_dir = Path("./content/pdfs")
    if not pdf_dir.exists():
        pdf_dir.mkdir(parents=True)
        print(f"⚠️  Placez vos PDFs dans: {pdf_dir}")
    else:
        prompts_file = generator.create_batch_prompts(pdf_dir)
    
    # 3. Créer le script d'import
    generator.create_import_script()
    
    # 4. Générer le guide
    generate_workflow_guide()
    
    print("\n✅ Préparation terminée!")
    print("📋 Prochaines étapes:")
    print("1. Ouvrez les prompts dans le dossier de sortie")
    print("2. Copiez-collez dans Claude")
    print("3. Sauvegardez les réponses JSON")
    print("4. Lancez le script d'import")