import express from 'express';

const router = express.Router();

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
 * GET /api/products/:slug
 * ⚠️ JAMAIS DE SCRAPER ICI
 */
router.get('/:slug', (req, res) => {
  const { slug } = req.params;

  const product = PRODUCTS[slug];

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produit introuvable',
    });
  }

  res.json({
    success: true,
    product,
    source: 'static',
  });
});

export default router;
