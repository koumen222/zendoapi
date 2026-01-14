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
 * POST /api/admin/orders/bulk-delete
 * Delete multiple orders (admin only)
 * Utilise POST pour une meilleure compatibilité avec les corps de requête
 * NOTE: Cette route doit être définie AVANT /orders pour éviter les conflits
 */
router.post('/orders/bulk-delete', checkAdminKey, async (req, res) => {
  try {
    console.log('📦 Body reçu:', JSON.stringify(req.body));
    console.log('📦 Type de req.body:', typeof req.body);
    console.log('📦 req.body.ids:', req.body.ids);
    console.log('📦 Type de req.body.ids:', typeof req.body.ids);
    console.log('📦 Est un array?', Array.isArray(req.body.ids));

    const { ids } = req.body;

    // Vérifier que ids existe et est un tableau
    if (!ids) {
      console.error('❌ ids est undefined ou null');
      return res.status(400).json({
        success: false,
        message: 'Vous devez fournir un tableau d\'IDs pour supprimer des commandes',
        received: req.body,
      });
    }

    // Convertir en tableau si ce n'est pas déjà un tableau
    let idsArray = ids;
    if (!Array.isArray(ids)) {
      console.log('⚠️  ids n\'est pas un tableau, conversion...');
      if (typeof ids === 'string') {
        try {
          idsArray = JSON.parse(ids);
        } catch (e) {
          idsArray = [ids];
        }
      } else {
        idsArray = [ids];
      }
    }

    if (idsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le tableau d\'IDs ne peut pas être vide',
      });
    }

    console.log(`🗑️  Suppression en masse de ${idsArray.length} commande(s)`);
    console.log('📋 IDs à supprimer:', idsArray);

    const result = await Order.deleteMany({
      _id: { $in: idsArray },
      isSeed: { $ne: true }, // Ne pas supprimer les données de seed
    });

    console.log(`✅ ${result.deletedCount} commande(s) supprimée(s) avec succès`);

    res.json({
      success: true,
      message: `${result.deletedCount} commande(s) supprimée(s) avec succès`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('❌ Admin orders bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des commandes',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/orders
 * Create a new order (admin only)
 */
router.post('/orders', checkAdminKey, async (req, res) => {
  try {
    const { name, phone, city, address, productSlug, quantity, totalPrice, status, productName, productPrice, productShortDesc } = req.body;

    // Validation
    if (!name || !phone || !city || !productSlug) {
      return res.status(400).json({
        success: false,
        message: 'Les champs name, phone, city et productSlug sont requis',
      });
    }

    // Product data defaults
    const productData = {
      productName: productName || 'Hismile™ – Le Sérum Qui Blanchis tes dents dès le premier jour',
      productPrice: productPrice || (quantity === 1 ? '9,900 FCFA' : '14,000 FCFA'),
      productShortDesc: productShortDesc || 'Sérum correcteur de teinte pour les dents. Effet instantané, sans peroxyde.',
      productImages: [],
      productFullDesc: '',
      productBenefits: [],
      productUsage: '',
      productGuarantee: 'Il est recommandé par les dentistes du Cameroun et du monde entier.',
      productDeliveryInfo: '',
      productReviews: [],
    };

    // Calculer le prix total si non fourni
    let finalTotalPrice = totalPrice;
    if (!finalTotalPrice) {
      if (quantity === 1) {
        finalTotalPrice = '9,900 FCFA';
      } else if (quantity === 2) {
        finalTotalPrice = '14,000 FCFA';
      } else {
        const priceValue = quantity * 9900;
        finalTotalPrice = `${priceValue.toLocaleString('fr-FR')} FCFA`;
      }
    }

    // Create order
    const order = new Order({
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: address ? address.trim() : '',
      productSlug: productSlug.trim(),
      quantity: parseInt(quantity) || 1,
      totalPrice: finalTotalPrice,
      status: status || 'new',
      ...productData,
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      order,
    });
  } catch (error) {
    console.error('Admin order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/orders
 * Get all orders with filters (admin only)
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 50)
 *   - sort: sort field (default: -createdAt)
 *   - status: filter by status
 *   - search: search in name, phone, city, productName
 *   - city: filter by city
 *   - startDate: filter orders from this date (ISO format)
 *   - endDate: filter orders until this date (ISO format)
 */
router.get('/orders', checkAdminKey, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      sort = '-createdAt',
      status,
      search,
      city,
      startDate,
      endDate
    } = req.query;

    console.log('📥 GET /api/admin/orders - Query params:', req.query);

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Construire le filtre de base (exclure les données de seed)
    const filter = { isSeed: { $ne: true } };
    console.log('🔍 Filtre de base:', JSON.stringify(filter));

    // Filtre par statut
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filtre par ville
    if (city && city.trim()) {
      filter.city = { $regex: city.trim(), $options: 'i' };
    }

    // Filtre par dates
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Inclure toute la journée
        filter.createdAt.$lte = end;
      }
    }

    // Recherche textuelle (nom, téléphone, ville, produit)
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { productName: searchRegex },
        { address: searchRegex },
      ];
    }

    // Optimisation : utiliser lean() et sélectionner uniquement les champs nécessaires
    const orders = await Order.find(filter)
      .select('_id name phone city address productSlug quantity totalPrice productPrice productName productShortDesc status createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Compter le total avec le même filtre
    const total = await Order.countDocuments(filter);

    console.log(`✅ ${orders.length} commande(s) trouvée(s) sur ${total} total`);

    res.json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      filters: {
        status: status || 'all',
        search: search || '',
        city: city || '',
        startDate: startDate || '',
        endDate: endDate || '',
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

    // Exclure les données de seed
    if (order.isSeed === true) {
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

    // Ne pas modifier les données de seed
    if (order.isSeed === true) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de modifier une commande de seed',
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
    const { name, phone, city, address, quantity, totalPrice, status, productSlug, productName, productPrice, productShortDesc } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // Ne pas modifier les données de seed
    if (order.isSeed === true) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de modifier une commande de seed',
      });
    }

    // Mise à jour des champs fournis
    if (name !== undefined) order.name = name.trim();
    if (phone !== undefined) order.phone = phone.trim();
    if (city !== undefined) order.city = city.trim();
    if (address !== undefined) order.address = address.trim();
    if (quantity !== undefined) order.quantity = parseInt(quantity) || 1;
    if (totalPrice !== undefined) order.totalPrice = totalPrice;
    if (productSlug !== undefined) order.productSlug = productSlug.trim();
    if (productName !== undefined) order.productName = productName;
    if (productPrice !== undefined) order.productPrice = productPrice;
    if (productShortDesc !== undefined) order.productShortDesc = productShortDesc;
    
    // Valider et mettre à jour le statut
    const validStatuses = ['new', 'called', 'pending', 'processing', 'in_delivery', 'shipped', 'delivered', 'rescheduled', 'cancelled'];
    if (status !== undefined) {
      if (validStatuses.includes(status)) {
        order.status = status;
      } else {
        return res.status(400).json({
          success: false,
          message: `Statut invalide. Statuts valides: ${validStatuses.join(', ')}`,
        });
      }
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

    // Ne pas supprimer les données de seed
    if (order.isSeed === true) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de supprimer une commande de seed',
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
 * GET /api/admin/visits
 * Get all visits with filters (admin only)
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 100, max: 200)
 *   - sort: sort field (default: -createdAt)
 *   - path: filter by path
 *   - startDate: filter visits from this date (ISO format)
 *   - endDate: filter visits until this date (ISO format)
 *   - search: search in path, referrer, ip
 */
router.get('/visits', checkAdminKey, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      sort = '-createdAt', 
      startDate, 
      endDate,
      path,
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 200); // Max 200 items per page
    const skip = (pageNum - 1) * limitNum;

    // Construire le filtre de base (exclure les données de seed)
    const filter = { isSeed: { $ne: true } };
    
    // Filtre par chemin
    if (path && path.trim()) {
      filter.path = { $regex: path.trim(), $options: 'i' };
    }

    // Filtre par dates
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Inclure toute la journée
        filter.createdAt.$lte = end;
      }
    }

    // Recherche textuelle
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { path: searchRegex },
        { referrer: searchRegex },
        { ip: searchRegex },
      ];
    }

    // Optimisation : sélectionner uniquement les champs nécessaires
    const visits = await Visit.find(filter)
      .select('path referrer userAgent ip createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Visit.countDocuments(filter);

    res.json({
      success: true,
      visits,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      filters: {
        path: path || '',
        search: search || '',
        startDate: startDate || '',
        endDate: endDate || '',
      },
    });
  } catch (error) {
    console.error('Admin visits fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des visites',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/visits/:id
 * Delete a visit (admin only)
 */
router.delete('/visits/:id', checkAdminKey, async (req, res) => {
  try {
    const visitId = req.params.id;

    const visit = await Visit.findById(visitId);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visite non trouvée',
      });
    }

    // Ne pas supprimer les données de seed
    if (visit.isSeed === true) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de supprimer une visite de seed',
      });
    }

    await Visit.findByIdAndDelete(visitId);

    res.json({
      success: true,
      message: 'Visite supprimée avec succès',
    });
  } catch (error) {
    console.error('Admin visit delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la visite',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/visits
 * Delete multiple visits (admin only)
 */
router.delete('/visits', checkAdminKey, async (req, res) => {
  try {
    const { ids, startDate, endDate } = req.body;

    let filter = { isSeed: { $ne: true } };

    if (ids && Array.isArray(ids) && ids.length > 0) {
      filter._id = { $in: ids };
    } else if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vous devez fournir des IDs ou des dates pour supprimer des visites',
      });
    }

    const result = await Visit.deleteMany(filter);

    res.json({
      success: true,
      message: `${result.deletedCount} visite(s) supprimée(s) avec succès`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Admin visits bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des visites',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/orders
 * Delete multiple orders (admin only)
 * NOTE: Gardé pour compatibilité, mais POST /orders/bulk-delete est préféré
 */
router.delete('/orders', checkAdminKey, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez fournir un tableau d\'IDs pour supprimer des commandes',
      });
    }

    const result = await Order.deleteMany({
      _id: { $in: ids },
      isSeed: { $ne: true }, // Ne pas supprimer les données de seed
    });

    res.json({
      success: true,
      message: `${result.deletedCount} commande(s) supprimée(s) avec succès`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Admin orders bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des commandes',
      error: error.message,
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

    // Base filter (exclure les données de seed)
    const baseFilter = {
      createdAt: { $gte: startDate },
      isSeed: { $ne: true }
    };

    // Calculate visits for the period (optimisé)
    const visitsInRange = await Visit.countDocuments(baseFilter);

    // Optimisation : utiliser des agrégations MongoDB pour calculer les stats
    const ordersStats = await Order.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: {
              $cond: [
                { $in: ['$status', ['new', 'pending', 'called']] },
                1,
                0
              ]
            }
          },
          uniqueCustomers: { $addToSet: '$phone' },
          revenue: {
            $sum: {
              $let: {
                vars: {
                  price: {
                    $ifNull: [
                      { $arrayElemAt: [{ $split: [{ $ifNull: ['$totalPrice', '$productPrice'] }, ' '] }, 0] },
                      '0'
                    ]
                  }
                },
                in: {
                  $toDouble: {
                    $replaceAll: {
                      input: '$$price',
                      find: ',',
                      replacement: ''
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          pendingOrders: 1,
          uniqueCustomers: { $size: '$uniqueCustomers' },
          revenue: 1
        }
      }
    ]);

    const stats = ordersStats[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      uniqueCustomers: 0,
      revenue: 0
    };

    const totalOrders = stats.totalOrders;
    const pendingOrders = stats.pendingOrders;
    const totalRevenue = stats.revenue;
    const uniqueCustomers = stats.uniqueCustomers;

    // Calculate conversion rate
    const conversionRate = visitsInRange > 0 
      ? ((totalOrders / visitsInRange) * 100).toFixed(1) 
      : 0;

    // Calculate previous period for comparison (optimisé)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysNum);
    const previousEndDate = new Date(startDate);
    
    const previousFilter = {
      createdAt: { $gte: previousStartDate, $lt: previousEndDate },
      isSeed: { $ne: true }
    };

    const [previousVisits, previousOrdersStats] = await Promise.all([
      Visit.countDocuments(previousFilter),
      Order.aggregate([
        { $match: previousFilter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            revenue: {
              $sum: {
                $let: {
                  vars: {
                    price: {
                      $ifNull: [
                        { $arrayElemAt: [{ $split: [{ $ifNull: ['$totalPrice', '$productPrice'] }, ' '] }, 0] },
                        '0'
                      ]
                    }
                  },
                  in: {
                    $toDouble: {
                      $replaceAll: {
                        input: '$$price',
                        find: ',',
                        replacement: ''
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalOrders: 1,
            revenue: 1
          }
        }
      ])
    ]);

    const previousStats = previousOrdersStats[0] || {
      totalOrders: 0,
      revenue: 0
    };

    const previousRevenue = previousStats.revenue;
    const previousOrdersCount = previousStats.totalOrders;

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

    // Generate sparkline data (last 20 days) - optimisé avec agrégation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sparklineStartDate = new Date(today);
    sparklineStartDate.setDate(sparklineStartDate.getDate() - 19);

    const [visitsSparkline, ordersSparkline] = await Promise.all([
      Visit.aggregate([
        {
          $match: {
            createdAt: { $gte: sparklineStartDate },
            isSeed: { $ne: true }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sparklineStartDate },
            isSeed: { $ne: true }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Créer un map pour un accès rapide
    const visitsMap = new Map(visitsSparkline.map(item => [item._id, item.count]));
    const ordersMap = new Map(ordersSparkline.map(item => [item._id, item.count]));

    // Générer les données pour les 20 derniers jours
    const sparklineData = [];
    for (let i = 19; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      sparklineData.push({
        visits: visitsMap.get(dateKey) || 0,
        orders: ordersMap.get(dateKey) || 0,
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

