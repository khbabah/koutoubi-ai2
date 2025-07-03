# 🎓 Koutoubi AI - Plateforme d'Apprentissage Intelligente

![Koutoubi AI](https://img.shields.io/badge/Version-2.0-blue) ![Status](https://img.shields.io/badge/Status-Production_Ready-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Comptes de test](#-comptes-de-test)
- [Architecture](#-architecture)
- [Guide d'utilisation](#-guide-dutilisation)
- [API Documentation](#-api-documentation)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)

## 🌟 Vue d'ensemble

Koutoubi AI est une plateforme d'apprentissage complète qui combine manuels scolaires numériques et intelligence artificielle pour révolutionner l'éducation. Conçue spécialement pour le système éducatif mauritanien, elle offre des outils d'apprentissage personnalisés pour les élèves, enseignants et parents.

### Technologies utilisées

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, Python 3.10+, SQLAlchemy, Alembic
- **Base de données**: PostgreSQL (production), SQLite (développement)
- **IA**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Cache**: Redis
- **Stockage**: AWS S3 / Local

## 🚀 Fonctionnalités

### Pour les Élèves
- 📚 **Bibliothèque numérique** : Accès aux manuels scolaires (6ème → Terminale)
- 🤖 **Assistant IA** : Résumés intelligents, explications personnalisées
- 🧠 **Quiz adaptatifs** : Tests générés par IA selon le niveau
- 🎴 **Flashcards intelligentes** : Révision avec répétition espacée
- 📊 **Suivi de progression** : Statistiques détaillées d'apprentissage
- 🎯 **Mindmaps** : Cartes mentales générées automatiquement
- 💬 **Chat contextuel** : Questions-réponses sur le contenu

### Pour les Enseignants
- 👨‍🏫 **Mode éducateur** : Création de contenu personnalisé
- 📝 **Éditeur de quiz** : Interface intuitive pour créer des évaluations
- 🎴 **Gestionnaire de flashcards** : Import/export CSV
- 👥 **Gestion des groupes** : Classes virtuelles avec codes d'invitation
- 📈 **Analyses détaillées** : Performance des élèves en temps réel
- 📤 **Partage de contenu** : Distribution facile aux élèves

### Pour les Parents
- 👨‍👩‍👧 **Suivi familial** : Vue sur la progression des enfants
- 📊 **Rapports détaillés** : Temps d'étude, scores, activités
- 🔔 **Notifications** : Alertes sur les performances
- 💳 **Gestion abonnement** : Contrôle des plans familiaux

### Pour les Administrateurs
- 🛡️ **Super Admin Panel** : Gestion complète de la plateforme
- 👥 **Gestion utilisateurs** : CRUD, rôles, permissions
- 📊 **Analytics avancés** : Métriques système et utilisation
- 🎯 **Modération contenu** : Validation et suppression
- 📥 **Export données** : CSV, rapports personnalisés

## 📦 Installation

### Prérequis

```bash
# Backend
Python 3.10+
pip
virtualenv

# Frontend
Node.js 18+
npm ou yarn

# Base de données
PostgreSQL 14+ (production)
SQLite (développement)

# Cache (optionnel)
Redis 6+
```

### Installation Backend

```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/koutoubi-ai.git
cd koutoubi-ai

# 2. Créer l'environnement virtuel
cd koutoubi-backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Configuration
cp .env.example .env
# Éditer .env avec vos clés API et configuration

# 5. Initialiser la base de données
alembic upgrade head
python init_db.py

# 6. Lancer le serveur
uvicorn app.main:app --reload --port 8000
```

### Installation Frontend

```bash
# 1. Aller dans le dossier frontend
cd koutoubi-frontend

# 2. Installer les dépendances
npm install

# 3. Configuration
cp .env.example .env.local
# Éditer .env.local

# 4. Lancer le serveur de développement
npm run dev
```

## 👥 Comptes de test

### Compte Super Admin
```
Email : admin@koutoubi.ai
Mot de passe : Admin123!
Accès : Gestion complète de la plateforme
```

### Comptes Enseignants
```
Principal :
Email : teacher@koutoubi.ai
Mot de passe : Teacher123!

Mauritanien :
Email : prof.mohamed@koutoubi.mr
Mot de passe : teacher123
```

### Comptes Élèves
```
Principal :
Email : student@koutoubi.ai
Mot de passe : Student123!

Mauritanien :
Email : eleve.fatimetou@koutoubi.mr
Mot de passe : student123
```

### Comptes Parents
```
Principal :
Email : parent@koutoubi.ai
Mot de passe : Parent123!

Mauritanien :
Email : parent.sidi@koutoubi.mr
Mot de passe : parent123
```

### Comptes de démonstration
```
Demo Enseignant : teacher.demo@koutoubi.ai / Demo123!
Demo Élève : student.demo@koutoubi.ai / Demo123!
Demo Parent : parent.demo@koutoubi.ai / Demo123!
```

## 🏗️ Architecture

### Structure du projet

```
koutoubi-ai/
├── koutoubi-backend/
│   ├── app/
│   │   ├── api/          # Endpoints API
│   │   ├── core/         # Configuration, sécurité
│   │   ├── models/       # Modèles SQLAlchemy
│   │   ├── schemas/      # Schémas Pydantic
│   │   ├── services/     # Logique métier
│   │   └── utils/        # Utilitaires
│   ├── alembic/          # Migrations DB
│   ├── tests/            # Tests unitaires
│   └── requirements.txt
│
├── koutoubi-frontend/
│   ├── src/
│   │   ├── app/          # Pages Next.js
│   │   ├── components/   # Composants React
│   │   ├── hooks/        # Hooks personnalisés
│   │   ├── lib/          # Utilitaires, API
│   │   ├── store/        # État global (Zustand)
│   │   └── styles/       # CSS/Tailwind
│   ├── public/           # Assets statiques
│   └── package.json
│
├── scripts/              # Scripts utilitaires
├── docs/                 # Documentation
└── README.md
```

### Modèles de données principaux

```python
# Utilisateurs
User:
  - id, email, username, password
  - role: student/teacher/parent/admin/super_admin
  - full_name, avatar_url, is_active

# Contenu éducatif
Chapter:
  - niveau, matiere, numero, title
  - pdf_path, page_start, page_end

CustomQuiz:
  - title, description, difficulty
  - questions, time_limit, pass_score

CustomFlashcardDeck:
  - title, description, cards
  - spaced_repetition settings

# Groupes et progression
StudyGroup:
  - name, code, school, grade_level
  - created_by (teacher), members

UserProgress:
  - user_id, chapter_id
  - quiz_scores, flashcard_mastery
  - study_time, last_activity
```

## 📖 Guide d'utilisation

### 1. Première connexion

1. Accédez à http://localhost:3000
2. Cliquez sur "Se connecter"
3. Utilisez un des comptes de test
4. Explorez le dashboard

### 2. Navigation principale

#### Dashboard (`/dashboard`)
- Vue d'ensemble des cours
- Filtres par niveau, année, matière
- Accès rapide aux favoris
- Statistiques personnelles

#### Cours (`/cours/{niveau}/{année}/{matière}`)
- Lecteur PDF intégré
- Outils IA dans la sidebar
- Navigation par chapitres
- Prise de notes

#### Mode Éducateur (`/educator`)
- Création de quiz et flashcards
- Gestion des groupes d'étude
- Suivi des élèves
- Analyses de performance

#### Administration (`/admin`) - Super Admin uniquement
- Gestion utilisateurs
- Gestion groupes système
- Modération contenu
- Rapports et analytics

### 3. Fonctionnalités IA

#### Résumé intelligent
1. Ouvrir un PDF
2. Sélectionner du texte
3. Cliquer sur "Résumer avec l'IA"
4. Choisir le niveau de détail

#### Quiz généré
1. Dans un chapitre
2. Cliquer sur "Générer un quiz"
3. Sélectionner difficulté et nombre
4. Répondre et voir les corrections

#### Mindmap automatique
1. Sélectionner un chapitre
2. Cliquer sur "Créer une mindmap"
3. Visualiser et exporter

### 4. Abonnements

#### Plans disponibles
- **Gratuit** : 5 résumés IA/mois
- **Étudiant** : 50 résumés, quiz illimités (1900 MRU/mois)
- **Premium** : Illimité + fonctions avancées (3500 MRU/mois)
- **Famille** : 5 comptes liés (7900 MRU/mois)

## 🔌 API Documentation

### Authentification

```bash
# Login
POST /api/v1/auth/token
Content-Type: application/x-www-form-urlencoded

username=teacher@koutoubi.ai&password=Teacher123!

# Response
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "teacher@koutoubi.ai",
    "role": "teacher"
  }
}
```

### Endpoints principaux

```bash
# Utilisateurs
GET    /api/v1/auth/me           # Profil actuel
PUT    /api/v1/auth/me           # Modifier profil
POST   /api/v1/auth/register     # Inscription
POST   /api/v1/auth/refresh      # Renouveler token

# Contenu
GET    /api/v1/content/courses   # Liste des cours
GET    /api/v1/content/pdf/{id}  # Accès PDF
POST   /api/v1/content/summary   # Générer résumé
POST   /api/v1/content/quiz      # Générer quiz

# Éducation
GET    /api/v1/educational/quizzes      # Mes quiz
POST   /api/v1/educational/quizzes      # Créer quiz
GET    /api/v1/educational/flashcards   # Mes flashcards
POST   /api/v1/educational/flashcards   # Créer deck

# Groupes
GET    /api/v1/educational/study-groups      # Mes groupes
POST   /api/v1/educational/study-groups      # Créer groupe
POST   /api/v1/educational/study-groups/join/{code}  # Rejoindre

# Admin (super_admin only)
GET    /api/v1/admin/users       # Tous les utilisateurs
PUT    /api/v1/admin/users/{id}  # Modifier utilisateur
DELETE /api/v1/admin/users/{id}  # Supprimer
GET    /api/v1/admin/reports     # Rapports système
```

### Exemples d'utilisation

```javascript
// Frontend - Axios avec intercepteur
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

// Ajouter le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Utilisation
const getCourses = async () => {
  const response = await api.get('/content/courses');
  return response.data;
};
```

## 🚀 Déploiement

### Docker

```dockerfile
# Backend Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: koutoubi
      POSTGRES_USER: koutoubi
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./koutoubi-backend
    environment:
      DATABASE_URL: postgresql://koutoubi:secure_password@db/koutoubi
      SECRET_KEY: your-secret-key
      OPENAI_API_KEY: your-api-key
    depends_on:
      - db
    ports:
      - "8000:8000"

  frontend:
    build: ./koutoubi-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

### Variables d'environnement

#### Backend (.env)
```bash
# Base de données
DATABASE_URL=postgresql://user:pass@localhost/koutoubi
# ou SQLite pour dev
DATABASE_URL=sqlite:///./koutoubi.db

# Sécurité
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# APIs IA
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Stockage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Redis (optionnel)
REDIS_URL=redis://localhost:6379
```

#### Frontend (.env.local)
```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1

# Analytics (optionnel)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=XXXXXXX

# Features flags
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_MINDMAPS=true
```

## 🛠️ Scripts utilitaires

### Créer un super admin
```bash
python create_super_admin.py
```

### Peupler avec des données de test
```bash
python populate_mauritanian_data.py
```

### Sauvegarder la base de données
```bash
python scripts/backup_db.py
```

### Nettoyer les fichiers temporaires
```bash
python scripts/cleanup_temp.py
```

## 📊 Monitoring

### Logs
- Backend : `koutoubi-backend/logs/`
- Frontend : Console navigateur + `npm run analyze`

### Métriques
- Temps de réponse API
- Utilisation mémoire/CPU
- Nombre d'utilisateurs actifs
- Requêtes IA par jour

## 🤝 Contribution

### Workflow Git

```bash
# 1. Fork le projet
# 2. Créer une branche
git checkout -b feature/nouvelle-fonctionnalite

# 3. Commiter les changements
git commit -m "feat: ajouter nouvelle fonctionnalité"

# 4. Pousser
git push origin feature/nouvelle-fonctionnalite

# 5. Créer une Pull Request
```

### Standards de code

- **Python** : Black, isort, pylint
- **TypeScript** : ESLint, Prettier
- **Commits** : Conventional Commits
- **Tests** : Coverage > 80%

## 📝 License

MIT License - voir [LICENSE](LICENSE)

## 👥 Équipe

- **Chef de projet** : Khaled Babah
- **Développement** : Équipe Koutoubi
- **Design** : UI/UX Team
- **IA** : ML Engineers

## 📞 Support

- Email : support@koutoubi.ai
- Documentation : https://docs.koutoubi.ai
- Discord : https://discord.gg/koutoubi

---

**Koutoubi AI** - Transformer l'éducation avec l'intelligence artificielle 🚀