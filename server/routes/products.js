import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();
const isProduction =
  process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;

/**
 * SOURCE UNIQUE DE VÉRITÉ (PRODUITS)
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

export default router;
