import express from 'express';
import Visit from '../models/Visit.js';

const router = express.Router();

/**
 * POST /api/analytics/track-visit
 * Track a page visit (public endpoint)
 */
router.post('/track-visit', async (req, res) => {
  try {
    const { path, referrer, userAgent } = req.body;
    const ip = req.ip || req.connection.remoteAddress || '';

    const visit = new Visit({
      path: path || '/',
      referrer: referrer || '',
      userAgent: userAgent || req.headers['user-agent'] || '',
      ip: ip,
      sessionId: req.sessionID || '',
    });

    await visit.save();

    res.json({
      success: true,
      message: 'Visit tracked',
    });
  } catch (error) {
    console.error('Visit tracking error:', error);
    // Don't fail the request if tracking fails - return success anyway
    res.json({
      success: false,
      message: 'Tracking failed but request continues',
    });
  }
});

export default router;
