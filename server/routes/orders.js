import express from 'express';
import Order from '../models/Order.js';
import { sendTelegramNotification } from '../utils/telegram.js';
import { sendMetaPurchase } from '../utils/metaCapi.js';

const router = express.Router();

const sanitizeText = (value, { maxLen = 120, allowEmpty = false } = {}) => {
  const text = typeof value === 'string' ? value : String(value ?? '');
  const trimmed = text.trim();
  if (!trimmed && !allowEmpty) return '';
  return trimmed.slice(0, maxLen);
};

const normalizePhone = (value) => {
  const raw = sanitizeText(value, { maxLen: 32, allowEmpty: true });
  if (!raw) return '';
  let normalized = raw.replace(/[^\d+]/g, '');
  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`;
  }
  return normalized;
};

const isValidPhone = (value) => {
  if (!value) return false;
  if (!value.startsWith('+')) return false;
  const digitsOnly = value.slice(1);
  return /^\d{8,15}$/.test(digitsOnly);
};

const clampQuantity = (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), 10);
};

/**
 * POST /api/orders
 * Create a new COD order for Zendo products
 */
router.post('/', async (req, res) => {
  try {
    console.log("[ORDER] New order received");
    const { name, phone, city, address = '', productSlug, quantity = 1 } = req.body;

    // Validation
    const safeName = sanitizeText(name, { maxLen: 80 });
    const safeCity = sanitizeText(city, { maxLen: 60 });
    const safeAddress = sanitizeText(address, { maxLen: 120, allowEmpty: true });
    const safePhone = normalizePhone(phone);
    const normalizedSlug = sanitizeText(productSlug, { maxLen: 30, allowEmpty: true })
      .toLowerCase() || 'hismile';
    const quantityNumber = clampQuantity(quantity);

    if (!safeName || !safeCity || !safePhone) {
      return res.status(400).json({
        success: false,
        message: 'Les champs nom, téléphone et ville sont requis',
      });
    }

    if (!isValidPhone(safePhone)) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone invalide (format attendu: +XXXXXXXX)',
      });
    }

    const normalizedSlug = String(productSlug).trim().toLowerCase();
    const quantityNumber = parseInt(quantity) || 1;
    const formatXaf = (value) => `${value.toLocaleString('fr-FR')} FCFA`;

    let productData = {};
    let totalPrice = '';
    let totalPriceValue = 0;

    if (normalizedSlug === 'gumies') {
      const gumiesOffers = {
        1: 16000,
        2: 25000,
        3: 31000,
      };
      const offerValue = gumiesOffers[quantityNumber];
      if (!offerValue) {
        return res.status(400).json({
          success: false,
          message: 'Quantité invalide pour Gumies (1, 2 ou 3 boites uniquement)',
        });
      }

      totalPriceValue = offerValue;
      totalPrice = formatXaf(offerValue);
      productData = {
        productName: 'Gumies',
        productPrice: totalPrice,
        productImages: [],
        productShortDesc: '',
        productFullDesc: '',
        productBenefits: [],
        productUsage: '',
        productGuarantee: '',
        productDeliveryInfo: '',
        productReviews: [],
      };
    } else {
      // Product data for Hismile (hardcoded)
      productData = {
        productName: 'Hismile™ – Le Sérum Qui Blanchis tes dents dès le premier jour',
        productPrice: quantityNumber === 1 ? '9,900 FCFA' : '14,000 FCFA',
        productImages: [],
        productShortDesc: 'Sérum correcteur de teinte pour les dents. Effet instantané, sans peroxyde.',
        productFullDesc: '',
        productBenefits: [],
        productUsage: '',
        productGuarantee: 'Il est recommandé par les dentistes du Cameroun et du monde entier.',
        productDeliveryInfo: '',
        productReviews: [],
      };

    // Calculer le prix total
    let totalPrice = '';
    let totalPriceValue = 0;
    
    if (quantity === 1) {
      totalPrice = '9,900 FCFA';
      totalPriceValue = 9900;
    } else if (quantity === 2) {
      totalPrice = '14,000 FCFA';
      totalPriceValue = 14000;
    } else {
      const priceValue = quantity * 9900;
      totalPrice = `${priceValue.toLocaleString('fr-FR')} FCFA`;
      totalPriceValue = priceValue;
    }

    // Create order
    const order = new Order({
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: address.trim(),
      productSlug: productSlug.trim(),
      quantity: quantityNumber,
      totalPrice,
      totalPriceValue, // Ajout de la valeur numérique pour Meta CAPI
      ...productData,
    });

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💾 SAUVEGARDE COMMANDE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Commande à sauvegarder:', {
      name: order.name,
      phone: order.phone,
      city: order.city,
      productName: order.productName,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      totalPriceValue: order.totalPriceValue,
    });
    
    await order.save();
    console.log('✅ Commande sauvegardée avec succès dans MongoDB');
    console.log('🆔 ID de la commande:', order._id);

    // Préparer les données de notification pour Telegram (en arrière-plan)
    const notificationData = {
      name: order.name,
      phone: order.phone,
      product: order.productName,
      price: totalPrice,
      quantity: order.quantity,
      city: order.city,
      address: order.address,
    };

    // Envoyer Meta CAPI Purchase en arrière-plan (ne bloque pas la réponse)
    process.nextTick(() => {
      try {
        const xff = req.headers["x-forwarded-for"];
        const ip =
          (typeof xff === "string" ? xff.split(",")[0].trim() : "") ||
          req.ip ||
          req.connection?.remoteAddress ||
          "";

        // Utiliser l'origine de la requête ou le frontend par défaut
        const origin = req.headers.origin || req.headers.referer;
        const frontendUrl = origin || "https://b12068c0.zendof.pages.dev";

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('📊 META CAPI - Purchase Event');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📦 Order ID:', order._id.toString());
        console.log('💰 Value:', totalPriceValue, 'XAF');
        console.log('🌐 URL:', frontendUrl);
        console.log('📍 IP:', ip || 'N/A');

        sendMetaPurchase({
          ip,
          userAgent: req.headers["user-agent"] || "",
          value: totalPriceValue,
          url: frontendUrl,
          currency: "XAF",
          orderId: order._id.toString(),
        })
          .then((result) => {
            if (result.success) {
              console.log('✅ [META-CAPI] Purchase event successfully sent to Meta');
            } else {
              console.warn('⚠️  [META-CAPI] Purchase event failed (non-blocking):', result.message || result.error);
            }
          })
          .catch((metaError) => {
            console.error('❌ [META-CAPI] Unexpected error (non-blocking):', metaError.message);
          });
      } catch (metaError) {
        console.error('❌ [META-CAPI] Unexpected error (non-blocking):', metaError.message);
      }
    });

    // ENVOYER LA RÉPONSE IMMÉDIATEMENT (avant Telegram)
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

    // Envoyer Telegram en arrière-plan SANS attendre la réponse
    // La réponse HTTP est déjà envoyée, on ne bloque plus rien
    process.nextTick(() => {
      console.log('📱 Envoi Telegram en arrière-plan (non-bloquant)...');
      // Envoyer sans await - la promesse se résout en arrière-plan
      sendTelegramNotification(notificationData)
        .then((telegramResult) => {
          if (telegramResult.success) {
            console.log(`✅ Telegram envoyé: ${telegramResult.successCount}/${telegramResult.failCount + telegramResult.successCount} destinataire(s)`);
          } else {
            // Ne pas logger les erreurs de timeout, c'est normal en arrière-plan
            if (telegramResult.error && !telegramResult.error.includes('Timeout')) {
              console.log(`⚠️  Telegram: ${telegramResult.failCount} échec(s)`);
            }
          }
        })
        .catch((telegramError) => {
          // Ignorer silencieusement les erreurs en arrière-plan
          // Les logs détaillés sont déjà dans sendTelegramNotification
        });
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