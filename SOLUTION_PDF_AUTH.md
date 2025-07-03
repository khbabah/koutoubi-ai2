# Solution Complète - Authentification PDF

## Problème Identifié
Le système utilise deux API clients différents :
1. **Nouveau** : `api-client.ts` qui utilise NextAuth
2. **Ancien** : `api.ts` qui utilise les cookies `auth-token`

Les composants PDF utilisent encore l'ancien client qui cherche le token dans les cookies, mais NextAuth ne synchronise pas automatiquement le token.

## Solution Appliquée

### 1. Hook de compatibilité (`/src/hooks/use-auth.tsx`)
Remplace `useAuthStore` par un hook qui utilise NextAuth en arrière-plan.

### 2. AuthSyncProvider (`/src/components/providers/auth-sync-provider.tsx`)
Synchronise automatiquement le token NextAuth avec les cookies pour l'ancien API client.

### 3. Migration des imports
Tous les imports `@/store/auth` ont été migrés vers `@/hooks/use-auth`.

### 4. Correction du login
La page de login redirige maintenant vers la destination originale après connexion.

## Test de la Solution

1. **Redémarrer le frontend** :
```bash
cd koutoubi-frontend
npm run dev
```

2. **Tester l'authentification** :
- Aller sur http://localhost:3000/login
- Se connecter avec : teacher_demo / Teacher_Demo123!
- Vérifier dans la console du navigateur : `[AuthSync] Syncing token to cookies`

3. **Tester l'accès PDF** :
- Aller sur http://localhost:3000/dashboard
- Cliquer sur un cours
- Le PDF devrait s'ouvrir sans redirection !

## Points de Vérification

1. **Console navigateur (F12)** :
   - Message `[AuthSync] Syncing token to cookies`
   - Pas d'erreurs 401

2. **Cookies** :
   - `next-auth.session-token` (NextAuth)
   - `auth-token` (synchronisé pour l'ancien système)

3. **Logs backend** :
   - Pas de 401 Unauthorized sur les endpoints

## Prochaines Étapes (Optionnel)

1. **Migration complète** : Remplacer progressivement `api.ts` par `api-client.ts`
2. **Suppression** : Une fois migré, supprimer :
   - `/src/store/auth.ts`
   - `/src/hooks/use-auth.tsx`
   - `/src/lib/api.ts` (remplacé par api-client.ts)

## Résumé
Le problème est résolu en synchronisant le token NextAuth avec les cookies pour maintenir la compatibilité avec l'ancien système. Les PDFs devraient maintenant s'ouvrir correctement sans redirection vers login.