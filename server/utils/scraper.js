import express from 'express';
import { scrapeProduct } from '../utils/scraper.js';

const router = express.Router();

/**
 * GET /api/admin/scrape/:slug
 * Route ISOLÉE (admin / debug)
 */
router.get('/scrape/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const data = await scrapeProduct(slug);

    if (!data) {
      return res.status(500).json({
        success: false,
        message: 'Scraping échoué',
      });
    }

    res.json({
      success: true,
      scrapedData: data,
    });
  } catch (error) {
    console.error('[SCRAPER ADMIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Erreur scraper',
      error: error.message,
    });
  }
});

export default router;
