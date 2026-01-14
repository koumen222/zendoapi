import express from 'express';
import Order from '../models/Order.js';
import Visit from '../models/Visit.js';

const router = express.Router();

/**
 * Middleware to check admin key
 */
const checkAdminKey = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  const validKey = process.env.ADMIN_KEY || 'ZENDO_ADMIN_2026';

  if (!adminKey || adminKey !== validKey) {
    return res.status(401).json({
      success: false,
      message: 'Accès non autorisé. Clé admin requise.',
    });
  }

  next();
};

/**
 * GET /api/admin/orders
 * Get all orders (admin only)
 */
router.get('/orders', checkAdminKey, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = '-createdAt' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find()
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Order.countDocuments();

    res.json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/orders/:id
 * Get single order details (admin only)
 */
router.get('/orders/:id', checkAdminKey, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Admin order fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status (admin only)
 * NOTE: Cette route doit être définie AVANT /orders/:id pour éviter les conflits
 */
router.patch('/orders/:id/status', checkAdminKey, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'called', 'pending', 'processing', 'in_delivery', 'shipped', 'delivered', 'rescheduled', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Statuts valides: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: 'Statut de la commande mis à jour',
      order,
    });
  } catch (error) {
    console.error('Admin order status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/orders/:id
 * Update an order (admin only)
 */
router.put('/orders/:id', checkAdminKey, async (req, res) => {
  try {
    const { name, phone, city, address, quantity, totalPrice, status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // Mise à jour des champs fournis
    if (name !== undefined) order.name = name.trim();
    if (phone !== undefined) order.phone = phone.trim();
    if (city !== undefined) order.city = city.trim();
    if (address !== undefined) order.address = address.trim();
    if (quantity !== undefined) order.quantity = parseInt(quantity) || 1;
    if (totalPrice !== undefined) order.totalPrice = totalPrice;
    if (status !== undefined && ['new', 'called', 'pending', 'processing', 'in_delivery', 'shipped', 'delivered', 'rescheduled', 'cancelled'].includes(status)) {
      order.status = status;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Commande mise à jour avec succès',
      order,
    });
  } catch (error) {
    console.error('Admin order update error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la commande',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/orders/:id
 * Delete an order (admin only)
 */
router.delete('/orders/:id', checkAdminKey, async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log('🗑️  Tentative de suppression de la commande:', orderId);

    // Vérifier que l'ID est valide
    if (!orderId || orderId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'ID de commande invalide',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      console.log('❌ Commande non trouvée:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    await Order.findByIdAndDelete(orderId);
    console.log('✅ Commande supprimée avec succès:', orderId);

    res.json({
      success: true,
      message: 'Commande supprimée avec succès',
    });
  } catch (error) {
    console.error('❌ Admin order delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la commande',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/track-visit
 * Track a page visit (public endpoint, no admin key required)
 * NOTE: Must be defined BEFORE checkAdminKey middleware routes
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
    // Don't fail the request if tracking fails
    res.json({
      success: false,
      message: 'Tracking failed but request continues',
    });
  }
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics (admin only)
 */
router.get('/stats', checkAdminKey, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    startDate.setHours(0, 0, 0, 0);

    // Calculate visits for the period
    const visitsInRange = await Visit.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Get orders in date range (optimized query)
    const ordersInRange = await Order.find({
      createdAt: { $gte: startDate }
    }).lean();

    // Calculate stats
    const totalOrders = ordersInRange.length;
    const pendingOrders = ordersInRange.filter(o => 
      o.status === 'new' || o.status === 'pending' || o.status === 'called'
    ).length;

    const totalRevenue = ordersInRange.reduce((sum, order) => {
      const price = order.totalPrice || order.productPrice || '0';
      const numPrice = parseFloat(price.replace(/[^\d.]/g, '')) || 0;
      return sum + numPrice;
    }, 0);

    const uniqueCustomers = new Set(ordersInRange.map(o => o.phone)).size;

    // Calculate conversion rate
    const conversionRate = visitsInRange > 0 
      ? ((totalOrders / visitsInRange) * 100).toFixed(1) 
      : 0;

    // Calculate previous period for comparison
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysNum);
    const previousEndDate = new Date(startDate);
    
    const previousOrders = await Order.find({
      createdAt: { $gte: previousStartDate, $lt: previousEndDate }
    }).lean();

    const previousVisits = await Visit.countDocuments({
      createdAt: { $gte: previousStartDate, $lt: previousEndDate }
    });

    const previousRevenue = previousOrders.reduce((sum, order) => {
      const price = order.totalPrice || order.productPrice || '0';
      const numPrice = parseFloat(price.replace(/[^\d.]/g, '')) || 0;
      return sum + numPrice;
    }, 0);

    const previousOrdersCount = previousOrders.length;

    // Calculate percentage changes
    const visitsChange = previousVisits > 0 
      ? (((visitsInRange - previousVisits) / previousVisits) * 100).toFixed(0)
      : visitsInRange > 0 ? 100 : 0;

    const revenueChange = previousRevenue > 0
      ? (((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(0)
      : totalRevenue > 0 ? 100 : 0;

    const ordersChange = previousOrdersCount > 0
      ? (((totalOrders - previousOrdersCount) / previousOrdersCount) * 100).toFixed(0)
      : totalOrders > 0 ? 100 : 0;

    // Generate sparkline data (last 20 days) - optimized
    const sparklineData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 19; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [dayVisits, dayOrders] = await Promise.all([
        Visit.countDocuments({
          createdAt: { $gte: date, $lt: nextDate }
        }),
        Order.countDocuments({
          createdAt: { $gte: date, $lt: nextDate }
        })
      ]);

      sparklineData.push({
        visits: dayVisits,
        orders: dayOrders,
      });
    }

    res.json({
      success: true,
      stats: {
        visits: {
          total: visitsInRange,
          change: parseFloat(visitsChange),
          sparkline: sparklineData.map(d => d.visits),
        },
        revenue: {
          total: totalRevenue,
          change: parseFloat(revenueChange),
        },
        orders: {
          total: totalOrders,
          change: parseFloat(ordersChange),
          pending: pendingOrders,
          sparkline: sparklineData.map(d => d.orders),
        },
        conversionRate: parseFloat(conversionRate),
        customers: uniqueCustomers,
      },
    });
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
});

export default router;

