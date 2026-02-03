import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();
const isProduction =
  process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;

/**
 * SOURCE UNIQUE DE VÉRITÉ (PRODUITS)
 * Produits statiques + produits DB
 */
const PRODUCTS = {
  hismile: {
    slug: 'hismile',
    productName: 'Hismile™ – Le Sérum Qui Blanchis tes dents dès le premier jour',
    price: '9,900 FCFA',
    images: [],
    shortDesc:
      'Sérum correcteur de teinte pour les dents. Effet immédiat, sans peroxyde.',
    fullDesc:
      'Hismile est un sérum dentaire innovant qui corrige la teinte des dents dès la première utilisation.',
    benefits: [
      'Résultat immédiat',
      'Sans peroxyde',
      'Sans douleur',
      'Recommandé par les dentistes',
    ],
    usage: 'Appliquer sur les dents propres.',
    offers: [
      { qty: 1, label: '1 Produit - 9,900 FCFA', priceValue: 9900 },
      { qty: 2, label: '2 Produits - 14,000 FCFA', priceValue: 14000 },
    ],
  },
  bbl: {
    slug: 'bbl',
    productName: 'BBL',
    price: '25 000 FCFA',
    images: [],
    shortDesc: 'Solution BBL pour une peau éclatante.',
    fullDesc: 'BBL est une solution innovante pour prendre soin de votre peau et obtenir un éclat naturel.',
    benefits: [
      'Peau éclatante',
      'Résultat rapide',
      'Facile à utiliser',
      'Sûr et efficace',
    ],
    usage: 'Appliquer selon les instructions.',
    offers: [
      { qty: 1, label: '1 Flacon - 25 000 FCFA', priceValue: 25000 },
      { qty: 2, label: '2 Flacons - 40 000 FCFA', priceValue: 40000 },
    ],
  },
  gumies: {
    slug: 'gumies',
    productName: 'Gumies',
    price: '16 000 FCFA',
    images: [],
    shortDesc: 'Gummies délicieux pour le bien-être quotidien.',
    fullDesc: 'Gumies sont des gummies au goût fruité conçus pour votre bien-être.',
    benefits: [
      'Goût fruité délicieux',
      'Faciles à consommer',
      'Bien-être quotidien',
      'Ingrédients naturels',
    ],
    usage: 'Prendre 1-2 gummies par jour.',
    offers: [
      { qty: 1, label: '1 Boite - 16 000 FCFA', priceValue: 16000 },
      { qty: 2, label: '2 Boites - 25 000 FCFA', priceValue: 25000 },
      { qty: 3, label: '3 Boites - 31 000 FCFA', priceValue: 31000 },
    ],
  },
};

/**
 * GET /api/products
 * List all products from DB + static
 */
router.get('/', async (req, res) => {
  try {
    const dbProducts = await Product.find().sort({ createdAt: -1 }).lean();
    const staticProducts = Object.values(PRODUCTS);
    
    // Merge: DB products first, then static ones not already in DB
    const dbSlugs = new Set(dbProducts.map((p) => p.slug));
    const merged = [
      ...dbProducts,
      ...staticProducts.filter((p) => !dbSlugs.has(p.slug)),
    ];

    res.json({
      success: true,
      products: merged,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
    });
  }
});

/**
 * GET /api/products/:slug
 * ⚠️ JAMAIS DE SCRAPER ICI
 */
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const normalizedSlug = (slug || '').toLowerCase();

  const dbProduct = await Product.findOne({ slug: normalizedSlug }).lean();
  const product = dbProduct || PRODUCTS[normalizedSlug];

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produit introuvable',
    });
  }

  if (isProduction) {
    // Cache agressif côté CDN/navigateur pour contenu statique
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=600, stale-while-revalidate=600"
    );
  }

  res.json({
    success: true,
    product,
    source: dbProduct ? 'db' : 'static',
  });
});

export { PRODUCTS };
export default router;
