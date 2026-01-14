# 🗄️ Configuration MongoDB avec Mongoose - Zendo

## ✅ État actuel

Le projet utilise déjà **MongoDB avec Mongoose** ! Tout est configuré et prêt à l'emploi.

## 📦 Dépendances installées

- `mongoose` : ^8.0.3 (déjà dans package.json)
- `dotenv` : ^16.3.1 (pour les variables d'environnement)

## ⚙️ Configuration

### 1. Fichier `.env`

Créez un fichier `.env` à la racine du projet :

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/zendo

# Pour MongoDB Atlas (cloud)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/zendo?retryWrites=true&w=majority

# Autres variables
ADMIN_KEY=ZENDO_ADMIN_2026
PORT=3001
NODE_ENV=development
```

### 2. Options de connexion MongoDB

#### Option A : MongoDB Local

Si vous avez MongoDB installé localement :

```env
MONGO_URI=mongodb://localhost:27017/zendo
```

**Installer MongoDB localement :**
- Windows : Téléchargez depuis [mongodb.com](https://www.mongodb.com/try/download/community)
- Mac : `brew install mongodb-community`
- Linux : `sudo apt-get install mongodb`

#### Option B : MongoDB Atlas (Recommandé pour production)

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit (M0)
3. Créez un utilisateur avec mot de passe
4. Ajoutez votre IP dans "Network Access"
5. Copiez la connection string :

```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/zendo?retryWrites=true&w=majority
```

## 🏗️ Structure MongoDB

### Modèle Order (déjà créé)

Le modèle `Order` est défini dans `server/models/Order.js` avec les champs suivants :

- **Informations client** : name, phone, city, address
- **Informations produit** : productSlug, productName, productPrice
- **Données produit complètes** : productImages, productShortDesc, productFullDesc, productBenefits, productUsage, productGuarantee, productDeliveryInfo, productReviews
- **Métadonnées** : createdAt, updatedAt (timestamps automatiques)

### Collection dans MongoDB

Les commandes seront stockées dans la collection `orders` de la base de données `zendo`.

## 🚀 Utilisation

### Démarrer le serveur

```bash
npm run dev:server
```

Le serveur se connectera automatiquement à MongoDB et affichera :
```
✅ MongoDB Connected: localhost:27017
📊 Database: zendo
🚀 Server running on port 3001
```

### Vérifier la connexion

Visitez : `http://localhost:3001/api/health`

Réponse :
```json
{
  "status": "OK",
  "message": "Zendo COD API is running",
  "database": "connected",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔍 Vérifier les données MongoDB

### Avec MongoDB Shell (mongosh)

```bash
# Se connecter
mongosh

# Utiliser la base de données
use zendo

# Voir toutes les collections
show collections

# Voir toutes les commandes
db.orders.find().pretty()

# Compter les commandes
db.orders.countDocuments()

# Voir une commande spécifique
db.orders.findOne({ name: "John Doe" })
```

### Avec MongoDB Compass (GUI)

1. Téléchargez [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connectez-vous avec : `mongodb://localhost:27017`
3. Sélectionnez la base `zendo`
4. Explorez la collection `orders`

## 📝 Exemples de requêtes

### Créer une commande (via API)

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marie Kouassi",
    "phone": "+225 07 12 34 56 78",
    "city": "Abidjan",
    "address": "123 Rue de la Paix, Cocody",
    "productSlug": "serum-correcteur-de-teinte-pour-les-dents-effet-instantane-sans-peroxyde-sourire-plus-net"
  }'
```

### Récupérer toutes les commandes (admin)

```bash
curl -X GET http://localhost:3001/api/admin/orders \
  -H "x-admin-key: ZENDO_ADMIN_2026"
```

## 🛠️ Gestion des erreurs

### Erreur de connexion

Si vous voyez :
```
❌ MongoDB connection error: connect ECONNREFUSED
```

**Solutions :**
1. Vérifiez que MongoDB est démarré : `mongod` ou `brew services start mongodb-community`
2. Vérifiez l'URI dans `.env`
3. Vérifiez que le port 27017 n'est pas bloqué

### Erreur d'authentification (Atlas)

Si vous voyez :
```
❌ MongoDB connection error: Authentication failed
```

**Solutions :**
1. Vérifiez le username/password dans l'URI
2. Vérifiez que votre IP est autorisée dans Atlas
3. Vérifiez que l'utilisateur a les bonnes permissions

## 📚 Ressources

- [Documentation Mongoose](https://mongoosejs.com/docs/)
- [Documentation MongoDB](https://docs.mongodb.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## ✅ Checklist

- [x] Mongoose installé
- [x] Modèle Order créé
- [x] Connexion MongoDB configurée
- [x] Routes API utilisent Mongoose
- [ ] Fichier `.env` créé avec `MONGO_URI`
- [ ] MongoDB démarré (local) ou cluster Atlas créé
- [ ] Test de connexion réussi
