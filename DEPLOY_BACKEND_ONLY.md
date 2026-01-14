# 🚂 Déploiement Backend uniquement sur Railway

Ce guide vous explique comment déployer **uniquement le backend** sur Railway.

**📌 Note importante :** Ce guide utilise la branche **`backend`** qui contient uniquement le code backend, séparé du frontend.

## 📋 Prérequis

- ✅ Compte GitHub avec votre code
- ✅ Compte Railway (https://railway.app)
- ✅ MongoDB Atlas (ou autre base MongoDB)

## 🚀 Étapes de déploiement

### 1️⃣ Préparer le code sur GitHub

```bash
# Vérifier que tout est commité
git status

# Si nécessaire, commit et push
git add .
git commit -m "Ready for Railway backend deployment"
git push origin main
```

### 2️⃣ Créer un projet Railway

1. Allez sur **https://railway.app**
2. Cliquez sur **"Start a New Project"** ou **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Autorisez Railway à accéder à votre GitHub
5. Sélectionnez votre repository `zendo`
6. **IMPORTANT :** Sélectionnez la branche **`backend`** (pas `main`)

### 3️⃣ Configurer le service backend

**IMPORTANT : Configurer le Root Directory**

1. Une fois le projet créé, Railway va créer un service
2. Cliquez sur le service pour l'ouvrir
3. Allez dans **Settings** (⚙️)
4. Dans la section **Source**, trouvez **Root Directory**
5. Définissez : `server` ⚠️ **CRUCIAL - Railway doit utiliser ce dossier**
6. **Start Command** : `npm start` (déjà configuré dans `server/package.json`)
7. **Build Command** : Laissez **VIDE** ou supprimez complètement (pas de build nécessaire)

**Alternative :** Si Railway ne détecte pas automatiquement :
- Créer un nouveau service
- Sélectionner "Empty Service"
- Dans Settings, définir Root Directory = `server`

### 4️⃣ Configurer les variables d'environnement

Dans l'onglet **Variables** du service, ajoutez toutes ces variables :

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/zendo
ADMIN_KEY=ZENDO_ADMIN_2026
TG_TOKEN=votre_token_telegram_bot
TG_CHAT_IDS=chat_id_1,chat_id_2
WHATSAPP_ACCESS_TOKEN=votre_token_whatsapp
WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
ADMIN_PHONE=237676463725
```

**⚠️ Important :**
- Ne définissez **PAS** `PORT` - Railway le gère automatiquement
- Ne définissez **PAS** `NODE_ENV` - Railway le définit automatiquement à `production`

### 5️⃣ Configurer MongoDB Atlas

Si vous utilisez MongoDB Atlas :

1. Allez sur **https://cloud.mongodb.com**
2. Sélectionnez votre cluster
3. Cliquez sur **Network Access**
4. Cliquez sur **Add IP Address**
5. Ajoutez `0.0.0.0/0` (autorise toutes les IPs, y compris Railway)
   - Ou ajoutez l'IP spécifique de Railway (visible dans les logs après le premier déploiement)

### 6️⃣ Déployer

1. Railway va automatiquement détecter le push sur GitHub et déployer
2. Ou cliquez manuellement sur **"Deploy"** dans l'interface Railway
3. Attendez 2-3 minutes que le déploiement se termine
4. Surveillez les logs dans l'onglet **Deployments**

### 7️⃣ Obtenir l'URL publique

1. Une fois déployé, allez dans **Settings** du service
2. Cliquez sur l'onglet **Networking**
3. Cliquez sur **"Generate Domain"**
4. Railway générera une URL comme : `https://votre-projet-production.up.railway.app`

### 8️⃣ Tester l'API

Testez votre API déployée :

```bash
# Health check
curl https://votre-projet-production.up.railway.app/api/health

# Réponse attendue :
# {
#   "status": "OK",
#   "message": "Zendo COD API is running",
#   "database": "connected",
#   "timestamp": "2024-..."
# }
```

## ✅ Vérification du déploiement

### Checklist

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Railway
- [ ] Root Directory configuré à `server`
- [ ] Variables d'environnement configurées
- [ ] MongoDB Atlas configuré avec accès Railway
- [ ] Déploiement réussi (vérifier les logs)
- [ ] Health check fonctionne
- [ ] URL publique générée

### Vérifier les logs

Dans Railway, allez dans l'onglet **Deployments** et cliquez sur le dernier déploiement pour voir les logs. Vous devriez voir :

```
✅ MongoDB connecté
🚀 Server running on port [PORT]
```

## 🔧 Configuration du frontend (après déploiement)

Une fois le backend déployé, mettez à jour votre frontend pour utiliser l'URL Railway.

### Option 1 : Proxy dans vite.config.js

Dans `client/vite.config.js` :

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://votre-projet-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
});
```

### Option 2 : Variable d'environnement

Créez `client/.env.production` :

```env
VITE_API_URL=https://votre-projet-production.up.railway.app
```

Puis dans votre code frontend, utilisez `import.meta.env.VITE_API_URL`.

## 🐛 Dépannage

### Le déploiement échoue

1. **Vérifiez les logs** dans Railway (onglet Deployments)
2. **Vérifiez Root Directory** : doit être `server`
3. **Vérifiez server/package.json** : doit exister avec le script `start`
4. **Vérifiez les variables d'environnement** : toutes doivent être définies

### Erreur "Cannot find module"

- Vérifiez que `server/package.json` contient toutes les dépendances
- Railway installe automatiquement avec `npm install`

### Erreur MongoDB

1. Vérifiez que `MONGO_URI` est correct dans les variables Railway
2. Vérifiez que MongoDB Atlas autorise les connexions depuis Railway
3. Vérifiez les logs Railway pour les erreurs de connexion

### Port déjà utilisé

- Railway gère automatiquement le port
- Ne définissez **jamais** `PORT` dans les variables d'environnement

### Le service ne démarre pas

1. Vérifiez les logs pour les erreurs
2. Vérifiez que `MONGO_URI` est défini
3. Vérifiez que le Root Directory est bien `server`

## 📝 Structure du projet

Railway va utiliser cette structure :

```
zendo/
├── server/              ← Railway utilise ce dossier
│   ├── index.js        ← Point d'entrée
│   ├── package.json    ← Dépendances et scripts
│   ├── routes/
│   ├── models/
│   └── utils/
├── client/              ← Ignoré par Railway (backend uniquement)
└── railway.json         ← Configuration Railway (optionnel)
```

## 🎉 C'est tout !

Votre backend est maintenant déployé sur Railway et accessible publiquement !

**URL de votre API :** `https://votre-projet-production.up.railway.app`

Vous pouvez maintenant :
- Tester l'API avec Postman ou curl
- Connecter votre frontend à cette URL
- Utiliser l'API depuis n'importe où
