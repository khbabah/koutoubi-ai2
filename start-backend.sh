#!/bin/bash

echo "🚀 Démarrage du backend Koutoubi..."
echo "=================================="

cd koutoubi-backend

# Vérifier l'environnement virtuel
if [ ! -d "../venv" ]; then
    echo "❌ Environnement virtuel non trouvé. Création..."
    python3 -m venv ../venv
fi

# Activer l'environnement virtuel
source ../venv/bin/activate

# Installer les dépendances si nécessaire
echo "📦 Vérification des dépendances..."
pip install -q -r requirements.txt

# Tester les imports
echo "🧪 Test des imports..."
python -c "
try:
    from app.main import app
    print('✅ Imports OK')
except Exception as e:
    print(f'❌ Erreur d\'import: {e}')
    exit(1)
"

# Démarrer le serveur
echo "🏃 Démarrage du serveur..."
echo "URL: http://localhost:8000"
echo "Docs: http://localhost:8000/docs"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000