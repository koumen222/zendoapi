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

    // Récupérer les données du produit depuis le slug
    let productData = {};
    let totalPrice = '';
    let totalPriceValue = 0;

    // Importer les produits statiques
    const productsModule = await import('./products.js');
    const PRODUCTS = productsModule.PRODUCTS || productsModule.default?.PRODUCTS || {};
    
    // Chercher le produit dans les produits statiques
    const staticProduct = PRODUCTS[productSlug];
    
    if (staticProduct) {
      // Utiliser les données du produit statique
      productData = {
        productName: staticProduct.productName,
        productPrice: staticProduct.price || 'Prix sur demande',
        productImages: staticProduct.images || [],
        productShortDesc: staticProduct.shortDesc || '',
        productFullDesc: staticProduct.fullDesc || '',
        productBenefits: staticProduct.benefits || [],
        productUsage: staticProduct.usage || '',
        productGuarantee: staticProduct.guarantee || '',
        productDeliveryInfo: staticProduct.deliveryInfo || '',
        productReviews: staticProduct.reviews || [],
      };

      // Calculer le prix selon les offres du produit
      const qty = parseInt(quantity) || 1;
      const selectedOffer = staticProduct.offers?.find(offer => offer.qty === qty);
      if (selectedOffer) {
        totalPrice = selectedOffer.label;
        totalPriceValue = selectedOffer.priceValue || 0;
      } else {
        // Fallback si pas d'offre trouvée - calculer prix de base
        if (staticProduct.price && staticProduct.price !== 'Prix sur demande') {
          // Extraire le prix numérique du prix de base
          const basePriceMatch = staticProduct.price.match(/[\d,]+/);
          const basePrice = basePriceMatch ? parseFloat(basePriceMatch[0].replace(/,/g, '')) : 0;
          totalPriceValue = basePrice * qty;
          totalPrice = `${totalPriceValue.toLocaleString('fr-FR')} FCFA`;
        } else {
          totalPrice = staticProduct.price || 'Prix sur demande';
          totalPriceValue = 0;
        }
      }
    } else {
      // Fallback Hismile si produit non trouvé
      productData = {
        productName: 'Hismile™ – Le Sérum Qui Blanchis tes dents dès le premier jour',
        productPrice: quantity === 1 ? '9,900 FCFA' : '14,000 FCFA',
        productImages: [],
        productShortDesc: 'Sérum correcteur de teinte pour les dents. Effet instantané, sans peroxyde.',
        productFullDesc: '',
        productBenefits: [],
        productUsage: '',
        productGuarantee: 'Il est recommandé par les dentistes du Cameroun et du monde entier.',
        productDeliveryInfo: '',
        productReviews: [],
      };

      const qty = parseInt(quantity) || 1;
      // Offres Hismile par défaut
      const hismileOffers = [
        { qty: 1, label: '1 Produit - 9,900 FCFA', priceValue: 9900 },
        { qty: 2, label: '2 Produits - 14,000 FCFA', priceValue: 14000 },
      ];
      
      const selectedHismileOffer = hismileOffers.find(offer => offer.qty === qty);
      if (selectedHismileOffer) {
        totalPrice = selectedHismileOffer.label;
        totalPriceValue = selectedHismileOffer.priceValue;
      } else {
        // Calcul par défaut si quantité > 2
        const priceValue = qty * 9900;
        totalPrice = `${priceValue.toLocaleString('fr-FR')} FCFA`;
        totalPriceValue = priceValue;
      }
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
      quantity: parseInt(quantity) || 1,
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
      productSlug: productSlug, // Ajouter le slug pour personnalisation
      price: totalPrice,
      quantity: order.quantity,
      city: order.city,
      address: order.address,
      orderId: order._id.toString(), // Ajouter l'ID de commande
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
