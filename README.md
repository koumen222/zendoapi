# Zendo - Beauté & Bien-être

Système e-commerce complet pour Zendo, spécialisé dans les produits de beauté et bien-être naturels avec paiement à la livraison (COD).

## 🚀 Installation

### Prérequis
- Node.js 18+
- MongoDB (local ou Atlas)

### Backend

```bash
npm install
```

### Frontend

```bash
cd client
npm install
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine :

```env
MONGO_URI=mongodb://localhost:27017/zendo
ADMIN_KEY=ZENDO_ADMIN_2026
PORT=3001
```

## 🏃 Démarrage

### Mode développement (backend + frontend)

```bash
npm run dev
```

### Backend uniquement

```bash
npm run dev:server
```

### Frontend uniquement

```bash
npm run dev:client
```

## 📁 Structure

```
zendo/
├── server/
│   ├── index.js          # Serveur Express
│   ├── models/
│   │   └── Order.js      # Modèle MongoDB
│   ├── routes/
│   │   ├── orders.js     # Route POST /api/orders
│   │   ├── admin.js      # Route GET /api/admin/orders
│   │   └── products.js   # Route GET /api/products/:slug
│   └── utils/
│       └── scraper.js    # Scraping Cheerio
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── CataloguePage.jsx
│   │   │   ├── ProductPage.jsx
│   │   │   └── AdminOrdersPage.jsx
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       ├── ProductCard.jsx
│   │       └── CODForm.jsx
│   └── package.json
└── package.json
```

## 🔌 API

### POST /api/orders

Créer une commande COD avec scraping automatique.

**Body:**
```json
{
  "name": "John Doe",
  "phone": "+225 07 12 34 56 78",
  "city": "Abidjan",
  "address": "123 Rue Example",
  "productSlug": "produit-exemple"
}
```

### GET /api/admin/orders

Récupérer toutes les commandes (admin uniquement).

**Headers:**
```
x-admin-key: ZENDO_ADMIN_2026
```

### GET /api/products/:slug

Récupérer les données d'un produit via scraping.

**Response:**
```json
{
  "success": true,
  "product": {
    "productName": "...",
    "productPrice": "...",
    "productImages": [...],
    "productShortDesc": "...",
    "productFullDesc": "...",
    "productBenefits": [...],
    "productUsage": "...",
    "productGuarantee": "...",
    "productDeliveryInfo": "...",
    "productReviews": [...]
  }
}
```

## 🛍️ Fonctionnalités E-commerce

- **Page d'accueil** : Hero section, avantages, produits vedettes
- **Catalogue** : Liste complète avec recherche en temps réel
- **Page produit** : Détails complets, images, bénéfices, formulaire COD
- **Navigation** : Header avec menu responsive, footer informatif
- **Design** : Interface moderne, mobile-first, animations fluides

## 🎯 Routes Frontend

- `/` - Page d'accueil avec hero section et produits vedettes
- `/catalogue` - Catalogue complet avec recherche
- `/produit/:slug` - Page produit détaillée avec formulaire COD
- `/admin/orders` - Dashboard admin (sans header/footer)

## 📱 Mobile First

L'interface est entièrement responsive et optimisée pour mobile.

## 🔒 Sécurité

- Clé admin requise pour accéder au dashboard
- Validation des données côté serveur
- Gestion d'erreurs complète

