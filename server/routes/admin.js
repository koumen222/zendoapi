import express from 'express';
import multer from 'multer';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Visit from '../models/Visit.js';
import CloudflareVisit from '../models/CloudflareVisit.js';
import { fetchDailyVisits, fetchMinuteVisits } from '../utils/cloudflareAnalytics.js';
import { uploadToR2 } from '../utils/r2.js';

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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * POST /api/admin/upload-image
 * Upload image to Cloudflare R2 (admin only)
 */
router.post('/upload-image', checkAdminKey, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier reçu',
      });
    }

    const { buffer, originalname, mimetype } = req.file;
    const { url, key } = await uploadToR2({
      buffer,
      originalname,
      contentType: mimetype,
      prefix: 'products',
    });

    res.status(201).json({
      success: true,
      url,
      key,
    });
  } catch (error) {
    console.error('R2 upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur upload image',
      error: error.message,
    });
  }
});

const formatDateOnly = (date) => date.toISOString().split('T')[0];

/**
 * POST /api/admin/products
 * Create a new product (admin only)
 */
router.post('/products', checkAdminKey, async (req, res) => {
  try {
    const { slug, productName, shortDesc = '', images = [], offers = [] } = req.body;

    if (!productName || !productName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du produit est requis',
      });
    }

    const normalizedSlug = (slug || productName)
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await Product.findOne({ slug: normalizedSlug }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ce slug existe déjà',
      });
    }

    const cleanedImages = Array.isArray(images)
      ? images.map((img) => img.trim()).filter(Boolean)
      : [];

    const cleanedOffers = Array.isArray(offers)
      ? offers
          .map((offer) => ({
            qty: Number(offer.qty) || 1,
            label: offer.label?.toString().trim() || '',
            priceValue: Number(offer.priceValue) || 0,
          }))
          .filter((offer) => offer.qty > 0)
      : [];

    const product = new Product({
      slug: normalizedSlug,
      productName: productName.trim(),
      shortDesc: shortDesc?.toString().trim() || '',
      images: cleanedImages,
      offers: cleanedOffers,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      product,
    });
  } catch (error) {
    console.error('Admin product creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit',
      error: error.message,
    });
  }
});

const getCloudflareVisitTotal = async (rangeStart, rangeEnd) => {
  const match = {
    source: 'daily',
    bucketStart: { $gte: rangeStart, $lte: rangeEnd },
  };
  const hasData = await CloudflareVisit.countDocuments(match);
  if (!hasData) return null;
  const totals = await CloudflareVisit.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$count' } } },
  ]);
  return totals[0]?.total || 0;
};

const getCloudflareSparkline = async (rangeStart, rangeEnd, days) => {
  const match = {
    source: 'daily',
    bucketStart: { $gte: rangeStart, $lte: rangeEnd },
  };
  const docs = await CloudflareVisit.find(match).select('bucketStart count bucket').lean();
  if (!docs.length) return null;

  const byDate = new Map();
  docs.forEach((doc) => {
    const key = doc.bucket || formatDateOnly(new Date(doc.bucketStart));
    byDate.set(key, (byDate.get(key) || 0) + (doc.count || 0));
  });

  const sparkline = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(rangeStart);
    day.setDate(rangeStart.getDate() + i);
    const key = formatDateOnly(day);
    sparkline.push(byDate.get(key) || 0);
  }
  return sparkline;
};

/**
 * POST /api/admin/orders/bulk-delete
 * Delete multiple orders (admin only)
 * Utilise POST pour une meilleure compatibilité avec les corps de requête
 * NOTE: Cette route doit être définie AVANT /orders pour éviter les conflits
 */
router.post('/orders/bulk-delete', checkAdminKey, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez fournir un tableau d\'IDs pour supprimer des commandes',
      });
    }

    console.log(`🗑️  Suppression en masse de ${ids.length} commande(s)`);

    const result = await Order.deleteMany({
      _id: { $in: ids },
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

    const normalizedPhone = phone.trim();
    if (!normalizedPhone.startsWith('+') || !/^\+\d{8,15}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone invalide (format attendu: +XXXXXXXX)',
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

    // Create order (isSeed: false pour les commandes admin réelles)
    const order = new Order({
      name: name.trim(),
      phone: normalizedPhone,
      city: city.trim(),
      address: address ? address.trim() : '',
      productSlug: productSlug.trim(),
      quantity: parseInt(quantity) || 1,
      totalPrice: finalTotalPrice,
      status: status || 'new',
      isSeed: false, // Commande réelle créée par admin
      ...productData,
    });

    console.log('💾 [ADMIN] Sauvegarde commande dans la BD:', {
      name: order.name,
      phone: order.phone,
      city: order.city,
      productSlug: order.productSlug,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      isSeed: order.isSeed,
    });

    await order.save();
    console.log('✅ [ADMIN] Commande sauvegardée dans la BD, ID:', order._id);

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
 *   - days: filter orders for the last N days (7, 30, 90, 365)
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
      endDate,
      days
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Construire le filtre de base (exclure les données de seed)
    const filter = { isSeed: { $ne: true } };

    // Filtre par statut
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filtre par ville
    if (city && city.trim()) {
      filter.city = { $regex: city.trim(), $options: 'i' };
    }

    // Filtre par dates
    if (startDate || endDate || days) {
      const rangeStart = startDate ? new Date(startDate) : null;
      const rangeEnd = endDate ? new Date(endDate) : null;
      if (!startDate && !endDate && days) {
        const daysNum = Math.max(parseInt(days, 10) || 1, 1);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(start.getDate() - daysNum + 1);
        start.setHours(0, 0, 0, 0);
        filter.createdAt = { $gte: start, $lte: end };
      } else {
        filter.createdAt = {};
        if (rangeStart) {
          rangeStart.setHours(0, 0, 0, 0);
          filter.createdAt.$gte = rangeStart;
        }
        if (rangeEnd) {
          rangeEnd.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = rangeEnd;
        }
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

    // Optimisation : exécuter la requête et le count en parallèle
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select('name phone city address productSlug quantity totalPrice productPrice productName productShortDesc status createdAt')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

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
        days: days || '',
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
    if (phone !== undefined) {
      const normalizedPhone = phone.trim();
      if (!normalizedPhone.startsWith('+') || !/^\+\d{8,15}$/.test(normalizedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Numéro de téléphone invalide (format attendu: +XXXXXXXX)',
        });
      }
      order.phone = normalizedPhone;
    }
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

    const order = await Order.findById(orderId).lean();

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

    await Order.deleteOne({ _id: orderId });
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
 * POST /api/admin/orders/bulk-delete
 * Delete multiple orders (admin only)
 * Body: { ids: [id1, id2, ...] }
 */
router.post('/orders/bulk-delete', checkAdminKey, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez fournir un tableau d\'IDs pour supprimer des commandes',
      });
    }

    // Valider que tous les IDs sont valides (24 caractères hexadécimaux)
    const invalidIds = ids.filter(id => !id || id.length !== 24);
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `IDs invalides détectés: ${invalidIds.join(', ')}`,
      });
    }

    console.log(`🗑️  Suppression de ${ids.length} commande(s)...`);

    const result = await Order.deleteMany({
      _id: { $in: ids },
      isSeed: { $ne: true }, // Ne pas supprimer les données de seed
    });

    console.log(`✅ ${result.deletedCount} commande(s) supprimée(s) avec succès`);

    res.json({
      success: true,
      message: `${result.deletedCount} commande(s) supprimée(s) avec succès`,
      deletedCount: result.deletedCount,
      requestedCount: ids.length,
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
 * POST /api/admin/analytics/cloudflare/import
 * Import historical visits from Cloudflare Analytics API
 */
router.post('/analytics/cloudflare/import', checkAdminKey, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate et endDate sont requis',
      });
    }

    const visits = await fetchDailyVisits({ startDate, endDate });
    if (!visits.length) {
      return res.json({
        success: true,
        imported: 0,
        updated: 0,
        message: 'Aucune donnée Cloudflare pour cette période',
      });
    }

    const operations = visits.map((visit) => ({
      updateOne: {
        filter: {
          zoneId: visit.zoneId,
          source: 'daily',
          bucketStart: visit.bucketStart,
        },
        update: {
          $set: {
            bucket: visit.bucket,
            count: visit.count,
          },
        },
        upsert: true,
      },
    }));

    const result = await CloudflareVisit.bulkWrite(operations, { ordered: false });
    res.json({
      success: true,
      imported: result.upsertedCount || 0,
      updated: result.modifiedCount || 0,
      total: visits.length,
    });
  } catch (error) {
    console.error('Cloudflare import error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l’import Cloudflare',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/analytics/cloudflare/sync
 * Sync recent minute-level visits from Cloudflare Analytics API
 */
router.post('/analytics/cloudflare/sync', checkAdminKey, async (req, res) => {
  try {
    const minutes = Math.min(Math.max(parseInt(req.body?.minutes, 10) || 60, 1), 1440);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - minutes * 60 * 1000);

    const visits = await fetchMinuteVisits({ startDate, endDate });
    if (!visits.length) {
      return res.json({
        success: true,
        imported: 0,
        updated: 0,
        message: 'Aucune donnée minute disponible',
      });
    }

    const operations = visits.map((visit) => ({
      updateOne: {
        filter: {
          zoneId: visit.zoneId,
          source: 'minute',
          bucketStart: visit.bucketStart,
        },
        update: {
          $set: {
            bucket: visit.bucket,
            count: visit.count,
          },
        },
        upsert: true,
      },
    }));

    const result = await CloudflareVisit.bulkWrite(operations, { ordered: false });
    res.json({
      success: true,
      imported: result.upsertedCount || 0,
      updated: result.modifiedCount || 0,
      total: visits.length,
    });
  } catch (error) {
    console.error('Cloudflare sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation Cloudflare',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/analytics/cloudflare/status
 * Get Cloudflare import/sync status
 */
router.get('/analytics/cloudflare/status', checkAdminKey, async (req, res) => {
  try {
    const [lastDaily, lastMinute, totalDaily, totalMinute] = await Promise.all([
      CloudflareVisit.findOne({ source: 'daily' }).sort({ bucketStart: -1 }).lean(),
      CloudflareVisit.findOne({ source: 'minute' }).sort({ bucketStart: -1 }).lean(),
      CloudflareVisit.countDocuments({ source: 'daily' }),
      CloudflareVisit.countDocuments({ source: 'minute' }),
    ]);

    res.json({
      success: true,
      lastDailyAt: lastDaily?.bucketStart || null,
      lastMinuteAt: lastMinute?.bucketStart || null,
      totals: {
        daily: totalDaily,
        minute: totalMinute,
      },
    });
  } catch (error) {
    console.error('Cloudflare status error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut Cloudflare',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/analytics/cloudflare/live
 * Get live visits from stored minute buckets
 */
router.get('/analytics/cloudflare/live', checkAdminKey, async (req, res) => {
  try {
    const minutes = Math.min(Math.max(parseInt(req.query?.minutes, 10) || 5, 1), 60);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - minutes * 60 * 1000);
    const totals = await CloudflareVisit.aggregate([
      {
        $match: {
          source: 'minute',
          bucketStart: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]);

    res.json({
      success: true,
      minutes,
      total: totals[0]?.total || 0,
      since: startDate,
    });
  } catch (error) {
    console.error('Cloudflare live error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des visites live',
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
    const { days = 30, startDate: startDateParam, endDate: endDateParam, all, includeSeed } = req.query;
    const daysNum = parseInt(days);
    const showAll = all === 'true' || all === '1' || days === 'all';
    const includeSeedData = includeSeed === 'true' || includeSeed === '1';

    let rangeStart;
    let rangeEnd;
    let rangeDays;

    if (showAll) {
      // Charger toutes les commandes sans filtre de date
      rangeStart = null;
      rangeEnd = null;
      rangeDays = 365;
    } else if (startDateParam || endDateParam) {
      const start = startDateParam ? new Date(startDateParam) : new Date(endDateParam);
      const end = endDateParam ? new Date(endDateParam) : new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      rangeStart = start;
      rangeEnd = end;
      rangeDays = Math.max(1, Math.ceil((rangeEnd - rangeStart + 1) / (1000 * 60 * 60 * 24)));
    } else {
      rangeEnd = new Date();
      rangeEnd.setHours(23, 59, 59, 999);
      rangeStart = new Date(rangeEnd);
      rangeStart.setDate(rangeStart.getDate() - Math.max(daysNum, 1) + 1);
      rangeStart.setHours(0, 0, 0, 0);
      rangeDays = Math.max(daysNum, 1);
    }

    // Base filter (exclure les données de seed sauf si includeSeed=true)
    const baseFilter = includeSeedData ? {} : { isSeed: { $ne: true } };
    
    // Ajouter le filtre de date seulement si on ne charge pas tout
    if (!showAll && rangeStart && rangeEnd) {
      baseFilter.createdAt = { $gte: rangeStart, $lte: rangeEnd };
    }

    // Debug: compter toutes les commandes (avec et sans seed)
    const totalOrdersInDB = await Order.countDocuments({});
    const ordersWithoutSeed = await Order.countDocuments({ isSeed: { $ne: true } });
    const ordersWithSeed = await Order.countDocuments({ isSeed: true });
    console.log('📊 [STATS] Commandes dans la BD:', {
      total: totalOrdersInDB,
      sansSeed: ordersWithoutSeed,
      avecSeed: ordersWithSeed,
      showAll,
      includeSeedData,
      rangeStart: rangeStart?.toISOString(),
      rangeEnd: rangeEnd?.toISOString(),
      filter: baseFilter,
    });

    // Calculate visits for the period (Cloudflare if available)
    let visitsInRange = 0;
    const visitsFilter = includeSeedData ? {} : { isSeed: { $ne: true } };
    if (showAll) {
      // Pour "all", compter toutes les visites sans filtre de date
      visitsInRange = await Visit.countDocuments(visitsFilter);
    } else if (rangeStart && rangeEnd) {
      // Pour dates précises, ajouter le filtre de date
      visitsFilter.createdAt = { $gte: rangeStart, $lte: rangeEnd };
      const cloudflareVisitsInRange = await getCloudflareVisitTotal(rangeStart, rangeEnd);
      visitsInRange = cloudflareVisitsInRange !== null
        ? cloudflareVisitsInRange
        : await Visit.countDocuments(visitsFilter);
    }

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
                    $ifNull: ['$totalPrice', '$productPrice']
                  }
                },
                in: {
                  $convert: {
                    input: {
                      $replaceAll: {
                        input: {
                          $replaceAll: {
                            input: {
                              $replaceAll: {
                                input: { $ifNull: ['$$price', '0'] },
                                find: 'FCFA',
                                replacement: ''
                              }
                            },
                            find: ' ',
                            replacement: ''
                          }
                        },
                        find: ',',
                        replacement: ''
                      }
                    },
                    to: 'double',
                    onError: 0,
                    onNull: 0
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

    console.log('📊 [STATS] Résultats agrégation:', {
      totalOrders,
      pendingOrders,
      totalRevenue,
      uniqueCustomers,
      visitsInRange,
    });

    // Calculate conversion rate
    const conversionRate = visitsInRange > 0 
      ? ((totalOrders / visitsInRange) * 100).toFixed(1) 
      : 0;

    // Calculate previous period for comparison (optimisé)
    let previousFilter = includeSeedData ? {} : { isSeed: { $ne: true } };
    let previousVisits = 0;
    
    if (!showAll && rangeStart && rangeEnd && rangeDays) {
      const previousEndDate = new Date(rangeStart);
      previousEndDate.setMilliseconds(-1);
      const previousStartDate = new Date(previousEndDate);
      previousStartDate.setDate(previousStartDate.getDate() - rangeDays + 1);
      previousStartDate.setHours(0, 0, 0, 0);
      previousFilter.createdAt = { $gte: previousStartDate, $lte: previousEndDate };
      
      previousVisits = await getCloudflareVisitTotal(previousStartDate, previousEndDate);
      if (previousVisits === null) {
        previousVisits = await Visit.countDocuments(previousFilter);
      }
    }

    const previousOrdersStats = showAll ? [] : await Order.aggregate([
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
                      $ifNull: ['$totalPrice', '$productPrice']
                    }
                  },
                  in: {
                    $convert: {
                      input: {
                        $replaceAll: {
                          input: {
                            $replaceAll: {
                              input: {
                                $replaceAll: {
                                  input: { $ifNull: ['$$price', '0'] },
                                  find: 'FCFA',
                                  replacement: ''
                                }
                              },
                              find: ' ',
                              replacement: ''
                            }
                          },
                          find: ',',
                          replacement: ''
                        }
                      },
                      to: 'double',
                      onError: 0,
                      onNull: 0
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
      ]);


    const previousStats = previousOrdersStats[0] || {
      totalOrders: 0,
      revenue: 0
    };

    const previousRevenue = previousStats.revenue;
    const previousOrdersCount = previousStats.totalOrders;

    // Calculate percentage changes (skip if showing all)
    const visitsChange = showAll ? 0 : (previousVisits > 0 
      ? (((visitsInRange - previousVisits) / previousVisits) * 100).toFixed(0)
      : visitsInRange > 0 ? 100 : 0);

    const revenueChange = showAll ? 0 : (previousRevenue > 0
      ? (((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(0)
      : totalRevenue > 0 ? 100 : 0);

    const ordersChange = showAll ? 0 : (previousOrdersCount > 0
      ? (((totalOrders - previousOrdersCount) / previousOrdersCount) * 100).toFixed(0)
      : totalOrders > 0 ? 100 : 0);

    // Generate sparkline data (up to 30 days) - optimisé avec agrégation
    let sparklineDays = Math.min(rangeDays, 30);
    let sparklineEndDate = showAll ? new Date() : new Date(rangeEnd);
    sparklineEndDate.setHours(23, 59, 59, 999);
    let sparklineStartDate = new Date(sparklineEndDate);
    sparklineStartDate.setDate(sparklineStartDate.getDate() - sparklineDays + 1);
    sparklineStartDate.setHours(0, 0, 0, 0);

    const cloudflareSparkline = await getCloudflareSparkline(sparklineStartDate, sparklineEndDate, sparklineDays);
    const [visitsSparkline, ordersSparkline] = await Promise.all([
      cloudflareSparkline
        ? Promise.resolve(
            cloudflareSparkline.map((count, index) => {
              const day = new Date(sparklineStartDate);
              day.setDate(day.getDate() + index);
              return { _id: formatDateOnly(day), count };
            })
          )
        : (() => {
            const visitMatchFilter = {
              createdAt: { $gte: sparklineStartDate, $lte: sparklineEndDate }
            };
            if (!includeSeedData) {
              visitMatchFilter.isSeed = { $ne: true };
            }
            return Visit.aggregate([
              {
                $match: visitMatchFilter
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
            ]);
          })(),
      (() => {
        const orderMatchFilter = {
          createdAt: { $gte: sparklineStartDate, $lte: sparklineEndDate }
        };
        if (!includeSeedData) {
          orderMatchFilter.isSeed = { $ne: true };
        }
        return Order.aggregate([
          {
            $match: orderMatchFilter
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
        ]);
      })()
    ]);

    // Créer un map pour un accès rapide
    const visitsMap = new Map(visitsSparkline.map(item => [item._id, item.count]));
    const ordersMap = new Map(ordersSparkline.map(item => [item._id, item.count]));

    // Générer les données pour la période sélectionnée
    const sparklineData = [];
    for (let i = 0; i < sparklineDays; i++) {
      const date = new Date(sparklineStartDate);
      date.setDate(date.getDate() + i);
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

