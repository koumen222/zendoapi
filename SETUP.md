# 🚀 Guide de Démarrage Rapide - Zendo COD

## Installation

### 1. Installer les dépendances backend
```bash
npm install
```

### 2. Installer les dépendances frontend
```bash
cd client
npm install
cd ..
```

### 3. Configurer l'environnement

Créez un fichier `.env` à la racine avec :
```env
MONGO_URI=mongodb://localhost:27017/zendo
ADMIN_KEY=ZENDO_ADMIN_2026
PORT=3001
```

**Pour MongoDB Atlas**, remplacez `MONGO_URI` par votre chaîne de connexion :
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/zendo
```

## Démarrage

### Mode développement (recommandé)
Lance le backend ET le frontend simultanément :
```bash
npm run dev
```

- Backend : http://localhost:3001
- Frontend : http://localhost:3000

### Démarrage séparé

**Backend uniquement :**
```bash
npm run dev:server
```

**Frontend uniquement :**
```bash
npm run dev:client
```

## 🧪 Test

1. **Accéder à un produit :**
   - Ouvrez http://localhost:3000
   - Entrez un slug produit (ex: `produit-exemple`)
   - Ou accédez directement : http://localhost:3000/produit/produit-exemple

2. **Passer une commande :**
   - Remplissez le formulaire COD
   - La commande sera créée avec scraping automatique

3. **Dashboard Admin :**
   - Accédez à http://localhost:3000/admin/orders
   - Entrez la clé admin : `ZENDO_ADMIN_2026`
   - Visualisez toutes les commandes avec détails complets

## 📝 Notes

- Le scraping fonctionne sur `https://zendo.site/products/{slug}`
- Les données produit sont automatiquement extraites lors de la création de commande
- Le système est mobile-first et responsive
- Toutes les erreurs sont gérées proprement

## 🔧 Dépannage

**Erreur MongoDB :**
- Vérifiez que MongoDB est démarré (local) ou que votre URI Atlas est correcte

**Erreur CORS :**
- Vérifiez que le proxy est configuré dans `client/vite.config.js`

**Scraping échoue :**
- Le système continue même si le scraping échoue
- Les données par défaut seront utilisées

