# 🚂 Déploiement Rapide sur Railway

## Guide étape par étape

### 1️⃣ Préparer votre code

Assurez-vous que votre code est sur GitHub :

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2️⃣ Créer un compte Railway

1. Allez sur https://railway.app
2. Cliquez sur **"Start a New Project"**
3. Connectez-vous avec GitHub

### 3️⃣ Créer un nouveau projet

1. Cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Autorisez Railway à accéder à votre GitHub
4. Sélectionnez votre repository `zendo`

### 4️⃣ Configurer le service (IMPORTANT)

**Railway doit utiliser le dossier `server/` comme racine :**

1. Allez dans **Settings** du service
2. Dans la section **Source**, définissez **Root Directory** : `server`
3. **Start Command** : `npm start` (déjà configuré dans `server/package.json`)
4. **Build Command** : Laissez vide (pas de build nécessaire pour Node.js)

**Note :** Si Railway ne détecte pas automatiquement le dossier `server/`, vous pouvez aussi :
- Créer un nouveau service et sélectionner le dossier `server/` spécifiquement
- Ou utiliser le fichier `server/railway.json` qui est déjà configuré

### 5️⃣ Configurer les variables d'environnement

Dans l'onglet **Variables** du service, ajoutez :

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/zendo
ADMIN_KEY=ZENDO_ADMIN_2026
TG_TOKEN=votre_token_telegram
TG_CHAT_IDS=chat_id_1,chat_id_2
WHATSAPP_ACCESS_TOKEN=votre_token_whatsapp (optionnel)
WHATSAPP_PHONE_NUMBER_ID=votre_phone_id (optionnel)
ADMIN_PHONE=237676463725 (optionnel)
```

**Important :**
- Railway définit automatiquement `PORT`, ne le définissez pas
- `NODE_ENV` sera automatiquement défini à `production`

### 6️⃣ Déployer

1. Railway déploiera automatiquement après le push sur GitHub
2. Ou cliquez sur **"Deploy"** dans l'interface Railway
3. Attendez que le déploiement se termine (2-3 minutes)

### 7️⃣ Obtenir l'URL

1. Une fois déployé, allez dans **Settings**
2. Cliquez sur **"Generate Domain"** pour obtenir une URL publique
3. Votre API sera accessible sur : `https://votre-projet.up.railway.app`

### 8️⃣ Tester l'API

```bash
# Health check
curl https://votre-projet.up.railway.app/api/health

# Devrait retourner :
# {
#   "status": "OK",
#   "message": "Zendo COD API is running",
#   "database": "connected",
#   "timestamp": "..."
# }
```

## 🔧 Configuration MongoDB Atlas

Si vous utilisez MongoDB Atlas :

1. Allez sur https://cloud.mongodb.com
2. Dans **Network Access**, ajoutez :
   - `0.0.0.0/0` (pour autoriser Railway)
   - Ou l'IP spécifique de Railway (visible dans les logs)

## 📝 Mise à jour du frontend

Une fois le backend déployé, mettez à jour votre frontend pour pointer vers l'URL Railway :

Dans `client/vite.config.js` ou votre configuration frontend :

```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://votre-projet.up.railway.app',
        changeOrigin: true,
      }
    }
  }
}
```

## 🐛 Dépannage

### Le déploiement échoue

1. Vérifiez les logs dans Railway (onglet **Deployments**)
2. Vérifiez que `server/package.json` existe
3. Vérifiez que toutes les variables d'environnement sont définies

### Erreur MongoDB

1. Vérifiez que `MONGO_URI` est correct
2. Vérifiez que votre IP est autorisée dans MongoDB Atlas
3. Vérifiez les logs Railway pour les erreurs de connexion

### Port déjà utilisé

- Railway gère automatiquement le port
- Ne définissez pas `PORT` manuellement dans les variables

## ✅ Checklist de déploiement

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Railway
- [ ] Service configuré avec Root Directory = `server`
- [ ] Variables d'environnement configurées
- [ ] MongoDB Atlas configuré avec accès Railway
- [ ] Déploiement réussi
- [ ] Health check fonctionne
- [ ] Frontend mis à jour avec la nouvelle URL

## 🎉 C'est tout !

Votre backend est maintenant déployé sur Railway et accessible publiquement !
