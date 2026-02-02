import express from 'express';
import Order from '../models/Order.js';
import { sendTelegramNotification } from '../utils/telegram.js';
import { sendMetaPurchase } from '../utils/metaCapi.js';

const router = express.Router();

/**
 * POST /api/orders
 * Create a new COD order for Zendo products
 */
router.post('/', async (req, res) => {
  try {
    console.log('[ORDER] New order received');

    const { name, phone, city, address = '', quarter = '', productSlug, quantity = 1 } = req.body;

    // Validation basique
    if (!name || !phone || !city) {
      return res.status(400).json({
        success: false,
        message: 'Les champs nom, téléphone et ville sont requis',
      });
    }

    // Produit Hismile (hardcodé – version simple)
    const productData = {
      productName: 'Hismile™ – Le Sérum Qui Blanchis tes dents dès le premier jour',
      productPrice: quantity === 1 ? '9,900 FCFA' : '14,000 FCFA',
      productImages: [],
      productShortDesc:
        'Sérum correcteur de teinte pour les dents. Effet instantané, sans peroxyde.',
      productFullDesc: '',
      productBenefits: [],
      productUsage: '',
      productGuarantee:
        'Il est recommandé par les dentistes du Cameroun et du monde entier.',
      productDeliveryInfo: '',
      productReviews: [],
    };

    // Calcul du prix
    let totalPrice = '';
    let totalPriceValue = 0;

    const qty = parseInt(quantity) || 1;

    if (qty === 1) {
      totalPrice = '9,900 FCFA';
      totalPriceValue = 9900;
    } else if (qty === 2) {
      totalPrice = '14,000 FCFA';
      totalPriceValue = 14000;
    } else {
      const priceValue = qty * 9900;
      totalPrice = `${priceValue.toLocaleString('fr-FR')} FCFA`;
      totalPriceValue = priceValue;
    }

    // Calculer totalPriceValue si manquant (pour les anciennes commandes)
    if (!totalPriceValue && totalPrice) {
      const priceMatch = totalPrice.match(/[\d,]+/);
      if (priceMatch) {
        totalPriceValue = parseFloat(priceMatch[0].replace(/,/g, '')) || 0;
      }
    }

    // Création de la commande (isSeed: false par défaut pour les vraies commandes)
    const order = new Order({
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: quarter ? quarter.trim() : address.trim(), // Utiliser quarter si disponible, sinon address
      productSlug: productSlug?.trim() || 'hismile',
      quantity: qty,
      totalPrice,
      totalPriceValue,
      isSeed: false, // Commande réelle, pas de seed
      ...productData,
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💾 SAUVEGARDE COMMANDE DANS LA BD');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Commande:', {
      name: order.name,
      phone: order.phone,
      city: order.city,
      productName: order.productName,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      totalPriceValue: order.totalPriceValue,
      isSeed: order.isSeed,
    });

    // Sauvegarder dans la BD MongoDB
    await order.save();
    console.log('✅ Commande sauvegardée dans la BD MongoDB');
    console.log('🆔 ID:', order._id);
    console.log('📅 Date:', order.createdAt);
    
    // Vérification que la commande est bien dans la BD
    const savedOrder = await Order.findById(order._id);
    if (savedOrder) {
      console.log('✅ Vérification: Commande confirmée dans la BD');
    } else {
      console.error('❌ ERREUR: Commande non trouvée après sauvegarde');
    }

    // Données Telegram
    const notificationData = {
      name: order.name,
      phone: order.phone,
      product: order.productName,
      price: totalPrice,
      quantity: order.quantity,
      city: order.city,
      address: order.address,
    };

    // Meta CAPI (non bloquant)
    process.nextTick(() => {
      try {
        const xff = req.headers['x-forwarded-for'];
        const ip =
          (typeof xff === 'string' ? xff.split(',')[0].trim() : '') ||
          req.ip ||
          req.connection?.remoteAddress ||
          '';

        const origin = req.headers.origin || req.headers.referer;
        const frontendUrl = origin || 'https://b12068c0.zendof.pages.dev';

        sendMetaPurchase({
          ip,
          userAgent: req.headers['user-agent'] || '',
          value: totalPriceValue,
          url: frontendUrl,
          currency: 'XAF',
          orderId: order._id.toString(),
        }).catch(() => {});
      } catch (e) {}
    });

    // Réponse HTTP immédiate
    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      order: {
        id: order._id,
        name: order.name,
        phone: order.phone,
        city: order.city,
        productName: order.productName,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
      },
    });

    // Telegram en arrière-plan
    process.nextTick(() => {
      sendTelegramNotification(notificationData).catch(() => {});
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: error.message,
    });
  }
});

export default router;
