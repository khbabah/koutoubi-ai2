#!/bin/bash

echo "🧪 Test complet NextAuth"
echo "======================="

# Redémarrer le frontend pour appliquer les changements
echo -e "\n1️⃣ Redémarrage du frontend..."
cd koutoubi-frontend
npm run build
npm run dev &
FRONTEND_PID=$!
cd ..

# Attendre que le frontend soit prêt
echo -e "\n⏳ Attente du démarrage (30s)..."
sleep 30

# Test de la page de debug
echo -e "\n2️⃣ Test de la page de debug:"
curl -s http://localhost:3000/debug-pdf-auth | grep -q "Debug PDF Authentication" && echo "✅ Page de debug accessible" || echo "❌ Page de debug non accessible"

# Instructions pour le test manuel
echo -e "\n3️⃣ Instructions pour test manuel:"
echo "================================"
echo "1. Ouvrez: http://localhost:3000/login"
echo "2. Connectez-vous avec: teacher_demo / Teacher_Demo123!"
echo "3. Après connexion, allez sur: http://localhost:3000/debug-pdf-auth"
echo "4. Cliquez sur 'Run PDF Access Tests'"
echo "5. Observez les résultats"
echo "6. Cliquez sur 'Go to Mathematics Course'"
echo "7. Le PDF devrait s'ouvrir sans redirection!"

echo -e "\n📝 Si le PDF redirige encore vers login:"
echo "- Vérifiez la console du navigateur (F12)"
echo "- Vérifiez les cookies next-auth.session-token"
echo "- Vérifiez les logs du middleware dans le terminal"

echo -e "\nPID du frontend: $FRONTEND_PID"
echo "Pour arrêter: kill $FRONTEND_PID"