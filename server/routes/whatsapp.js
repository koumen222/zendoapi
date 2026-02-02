import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = express.Router();

/**
 * POST /api/whatsapp/relance
 * Envoyer des messages de relance WhatsApp aux clients en attente
 */
router.post('/relance', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    // Vérifier la clé API
    if (apiKey !== 'ZENDO_WHATSAPP_2026') {
      return res.status(401).json({
        success: false,
        message: 'Clé API invalide'
      });
    }

    // Récupérer les commandes en attente depuis plus de 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const orders = await Order.find({
      status: 'ATTENTE',
      createdAt: { $lt: twentyFourHoursAgo },
      isSeed: { $ne: true }
    }).sort({ createdAt: 1 });

    const messages = [];

    for (const order of orders) {
      const daysSinceOrder = Math.floor((Date.now() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24));
      const montant = order.totalPrice || '0 FCFA';
      const produits = order.productName || 'Produit';
      
      // Déterminer le code promo selon le nombre de jours
      let promoCode = '';
      let promoText = '';
      
      if (daysSinceOrder === 1) {
        promoCode = 'RELANCE10FCFA';
        promoText = '10% off';
      } else if (daysSinceOrder >= 3) {
        promoCode = 'FLASH15FCFA';
        promoText = '15% off';
      }

      // Générer le message WhatsApp
      let message = `Salut ${order.name}! 😊\n\n`;
      message += `Ton panier t'attend: ${montant}\n`;
      message += `Produits: ${produits}\n`;
      message += `Jours en attente: ${daysSinceOrder}\n\n`;
      
      if (promoCode) {
        message += `🎁 Promo spéciale: ${promoText} avec code ${promoCode}\n\n`;
      }
      
      message += `Clique ici pour finaliser vite hein! 👇\n`;
      message += `https://zendo.cm/panier/${order._id}\n\n`;
      message += `Besoin d'aide? Appelle-nous: +237676463725\n\n`;
      message += `Zendo - Livraison partout au Cameroun 🇨🇲`;

      // Limiter à 160 caractères pour WhatsApp
      if (message.length > 160) {
        message = message.substring(0, 157) + '...';
      }

      messages.push({
        to: order.phone.startsWith('+') ? order.phone : `+237${order.phone}`,
        message,
        orderId: order._id,
        customerName: order.name,
        daysWaiting: daysSinceOrder,
        promoCode,
        amount: montant
      });
    }

    res.json({
      success: true,
      message: `${messages.length} messages de relance générés`,
      data: {
        totalOrders: orders.length,
        messages,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur génération relance WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des messages',
      error: error.message
    });
  }
});

/**
 * GET /api/whatsapp/stats
 * Statistiques des relances WhatsApp
 */
router.get('/stats', async (req, res) => {
  try {
    const { apiKey } = req.query;
    
    if (apiKey !== 'ZENDO_WHATSAPP_2026') {
      return res.status(401).json({
        success: false,
        message: 'Clé API invalide'
      });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const [
      totalWaiting,
      waiting1Day,
      waiting3Days,
      waitingMore3Days
    ] = await Promise.all([
      Order.countDocuments({ status: 'ATTENTE', isSeed: { $ne: true } }),
      Order.countDocuments({ 
        status: 'ATTENTE', 
        createdAt: { $gte: oneDayAgo, $lt: now },
        isSeed: { $ne: true }
      }),
      Order.countDocuments({ 
        status: 'ATTENTE', 
        createdAt: { $gte: threeDaysAgo, $lt: oneDayAgo },
        isSeed: { $ne: true }
      }),
      Order.countDocuments({ 
        status: 'ATTENTE', 
        createdAt: { $lt: threeDaysAgo },
        isSeed: { $ne: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalWaiting,
        waiting1Day,
        waiting3Days,
        waitingMore3Days,
        eligibleForRelance: waiting1Day + waiting3Days + waitingMore3Days,
        promo10Percent: waiting1Day,
        promo15Percent: waiting3Days + waitingMore3Days,
        statsAt: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur stats WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

export default router;
