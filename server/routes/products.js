import express from 'express';
import { scrapeProduct } from '../utils/scraper.js';

const router = express.Router();

/**
 * GET /api/products/:slug
 * Get product data by scraping
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug produit requis',
      });
    }

    const productData = await scrapeProduct(slug);

    res.json({
      success: true,
      product: productData,
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du produit',
      error: error.message,
    });
  }
});

export default router;
