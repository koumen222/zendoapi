# 🚂 Déploiement sur Railway

## Prérequis

1. Compte GitHub
2. Compte Railway (https://railway.app)
3. MongoDB Atlas (ou autre base MongoDB)

## 📋 Étapes de déploiement

### 1️⃣ Préparer le backend

Le fichier `server/index.js` est déjà configuré pour Railway avec :
- Connexion MongoDB via `process.env.MONGO_URI`
- Port dynamique via `process.env.PORT`
- Routes API configurées

### 2️⃣ Variables d'environnement

Dans Railway, configurez ces variables dans l'onglet "Variables" :

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/zendo
ADMIN_KEY=ZENDO_ADMIN_2026
TG_TOKEN=your_telegram_bot_token
TG_CHAT_IDS=chat_id_1,chat_id_2
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token (optionnel)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id (optionnel)
ADMIN_PHONE=237676463725 (optionnel)
```

**Note :** Railway définit automatiquement `PORT`, pas besoin de le configurer.

### 3️⃣ Push sur GitHub

Si ce n'est pas déjà fait :

```bash
git init
git add .
git commit -m "Initial backend ZENDO"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/zendo-backend.git
git push -u origin main
```

### 4️⃣ Déployer sur Railway

1. Allez sur https://railway.app
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub Repo"**
4. Autorisez Railway à accéder à votre GitHub
5. Sélectionnez votre repository `zendo-backend`
6. Railway détectera automatiquement le dossier `server/` et utilisera `server/package.json`

### 5️⃣ Configuration Railway

1. **Root Directory** : Configurez `server` comme répertoire racine dans les paramètres du service
2. **Variables d'environnement** : Ajoutez toutes les variables listées ci-dessus
3. **Build Command** : Laissez vide (pas de build nécessaire)
4. **Start Command** : `npm start` (déjà configuré dans `server/package.json`)

### 6️⃣ Obtenir l'URL de déploiement

Une fois déployé, Railway vous donnera une URL comme :
```
https://zendo-backend-production.up.railway.app
```

### 7️⃣ Tester l'API

```bash
# Health check
curl https://votre-url.railway.app/api/health

# Créer une commande
curl -X POST https://votre-url.railway.app/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "+237 6 12 34 56 78",
    "city": "Douala",
    "productSlug": "test-product"
  }'
```

## 🔧 Dépannage

### Le déploiement échoue

- Vérifiez que `server/package.json` existe et contient le script `start`
- Vérifiez que toutes les variables d'environnement sont configurées
- Consultez les logs Railway dans l'onglet "Deployments"

### Erreur de connexion MongoDB

- Vérifiez que `MONGO_URI` est correctement configuré
- Assurez-vous que votre IP est autorisée dans MongoDB Atlas (ou utilisez 0.0.0.0/0 pour Railway)

### Port déjà utilisé

- Railway gère automatiquement le port, ne définissez pas `PORT` manuellement

## 📝 Notes importantes

- ⚠️ Ne jamais commiter le fichier `.env` sur GitHub
- Le fichier `.gitignore` ignore déjà `.env`
- Railway utilise automatiquement le port fourni par la plateforme
- Les logs sont disponibles dans l'interface Railway
