import axios from 'axios';

// Les variables d'environnement sont déjà chargées par server/index.js
// Mais on les lit au moment de l'utilisation, pas au moment de l'import

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Fonction pour obtenir les variables d'environnement (lue à l'exécution, pas à l'import)
const getEnvVars = () => ({
  TG_TOKEN: process.env.TG_TOKEN,
  TG_CHAT_IDS_RAW: process.env.TG_CHAT_IDS || process.env.TG_CHAT_ID || '',
});
// Support pour plusieurs chat IDs (séparés par des virgules)
// Utilise TG_CHAT_IDS ou TG_CHAT_ID (pour compatibilité)
const TG_CHAT_IDS_RAW = process.env.TG_CHAT_IDS || process.env.TG_CHAT_ID || '';
const TG_CHAT_IDS = TG_CHAT_IDS_RAW ? TG_CHAT_IDS_RAW.split(',').map(id => id.trim()).filter(id => id) : [];

/**
 * Envoie un message Telegram via l'API officielle Telegram Bot
 * @param {Object} orderData - Données de la commande
 * @param {string} orderData.name - Nom du client
 * @param {string} orderData.phone - Téléphone du client
 * @param {string} orderData.product - Nom du produit
 * @param {string} orderData.price - Prix de la commande
 * @param {string} orderData.city - Ville du client
 * @returns {Promise<Object>} Réponse de l'API Telegram
 */
export async function sendTelegramNotification(orderData) {
  const startTime = Date.now();
  
  // Lire les variables d'environnement au moment de l'exécution
  const { TG_TOKEN, TG_CHAT_IDS_RAW } = getEnvVars();
  const TG_CHAT_IDS = TG_CHAT_IDS_RAW ? TG_CHAT_IDS_RAW.split(',').map(id => id.trim()).filter(id => id) : [];
  
  try {
    // Validation rapide des variables d'environnement
    if (!TG_TOKEN) {
      console.error('❌ TG_TOKEN non défini. Variables disponibles:', Object.keys(process.env).filter(k => k.includes('TG')));
      throw new Error('TG_TOKEN non défini dans .env');
    }
    
    if (!TG_CHAT_IDS || TG_CHAT_IDS.length === 0) {
      console.error('❌ TG_CHAT_IDS non défini. Valeur brute:', TG_CHAT_IDS_RAW);
      throw new Error('TG_CHAT_IDS non défini dans .env');
    }

    // Construction du message avec emojis (optimisé)
    const message = `🛒 NOUVELLE COMMANDE

👤 Nom: ${orderData.name}
📞 Téléphone: ${orderData.phone}
📦 Produit: ${orderData.product}
💰 Prix: ${orderData.price}
📍 Ville: ${orderData.city}`;

    // URL de l'API Telegram
    const url = `${TELEGRAM_API_URL}${TG_TOKEN}/sendMessage`;

    // Envoyer à tous les chat IDs en parallèle (optimisé pour vitesse)
    // Créer toutes les promesses d'envoi en parallèle
    const sendPromises = TG_CHAT_IDS.map(async (chatId) => {
      try {
        // Corps de la requête
        const payload = {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        };

        // Envoi de la requête avec timeout court car c'est en arrière-plan
        const response = await axios.post(url, payload, {
          timeout: 5000, // Timeout de 5 secondes - suffisant pour un envoi en arrière-plan
        });

        return {
          success: true,
          chatId: chatId,
          messageId: response.data.result?.message_id,
        };
      } catch (chatError) {
        let errorMessage = chatError.message || 'Erreur inconnue';
        let errorCode = chatError.response?.data?.error_code;
        
        // Gestion simplifiée des erreurs
        if (chatError.code === 'ENOTFOUND' || chatError.code === 'ECONNREFUSED' || chatError.code === 'ETIMEDOUT') {
          errorMessage = `Erreur réseau: ${chatError.code}`;
        } else if (chatError.response) {
          errorMessage = chatError.response.data?.description || chatError.message;
          errorCode = chatError.response.data?.error_code;
        }
        
        return {
          success: false,
          chatId: chatId,
          error: errorMessage,
          code: errorCode || chatError.code,
        };
      }
    });

    // Attendre que toutes les requêtes se terminent en parallèle avec timeout global de 8 secondes max
    // Plus court car c'est en arrière-plan et on ne veut pas bloquer
    const resultsPromise = Promise.all(sendPromises);
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve([]), 8000);
    });
    
    // Race entre les résultats et le timeout de 8 secondes
    const results = await Promise.race([resultsPromise, timeoutPromise]);
    
    // Si timeout, les requêtes continuent en arrière-plan mais on retourne immédiatement
    if (results.length === 0) {
      // Timeout atteint - c'est OK, les requêtes continuent en arrière-plan
      return {
        success: false,
        successCount: 0,
        failCount: TG_CHAT_IDS.length,
        totalDuration: 8000,
        results: TG_CHAT_IDS.map(chatId => ({ success: false, chatId, error: 'Timeout > 8s (en arrière-plan)' })),
      };
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    const successCount = results.filter(r => r && r.success).length;
    const failCount = results.filter(r => !r || !r.success).length;

    // Logs simplifiés - ne pas logger les timeouts car c'est normal en arrière-plan
    if (totalDuration <= 5000 && successCount > 0) {
      console.log(`✅ Telegram: ${successCount}/${TG_CHAT_IDS.length} envoyé(s) en ${totalDuration}ms`);
    }
    // Ne pas logger les warnings de timeout - c'est attendu en arrière-plan
    
    if (failCount > 0) {
      results.forEach((result) => {
        if (!result || !result.success) {
          console.error(`❌ Chat ID ${result?.chatId}: ${result?.error || 'Erreur'}`);
        }
      });
    }

    return {
      success: successCount > 0, // Succès si au moins un message a été envoyé
      successCount,
      failCount,
      totalDuration,
      results,
    };
  } catch (error) {
    console.error('\n');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ ERREUR LORS DE L\'ENVOI TELEGRAM');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('🕐 Timestamp:', new Date().toISOString());
    
    if (error.response) {
      // Erreur de l'API Telegram
      console.error('📡 Réponse HTTP reçue:');
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Données d\'erreur:', JSON.stringify(error.response.data, null, 2));
      
      const errorData = error.response.data;
      console.error('\n🔍 Détails de l\'erreur API:');
      console.error('   Code:', errorData.error_code || 'N/A');
      console.error('   Description:', errorData.description || 'N/A');
      console.error('   Parameters:', JSON.stringify(errorData.parameters || {}, null, 2));
      
      console.error('═══════════════════════════════════════════════════════════');
      console.error('\n');
      
      return {
        success: false,
        error: errorData.description || 'Erreur API Telegram',
        code: errorData.error_code,
        status: error.response.status,
        details: errorData,
      };
    } else if (error.request) {
      // Pas de réponse reçue
      console.error('🌐 Aucune réponse reçue du serveur Telegram');
      console.error('   Requête envoyée:', error.config?.url?.replace(TG_TOKEN || '', 'TOKEN_MASQUÉ') || 'N/A');
      console.error('   Méthode:', error.config?.method || 'N/A');
      console.error('   Message:', error.message);
      console.error('═══════════════════════════════════════════════════════════');
      console.error('\n');
      
      return {
        success: false,
        error: 'Aucune réponse du serveur Telegram',
        details: error.message,
      };
    } else {
      // Erreur lors de la configuration de la requête
      console.error('⚙️  Erreur de configuration de la requête');
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
      console.error('═══════════════════════════════════════════════════════════');
      console.error('\n');
      
      return {
        success: false,
        error: error.message || 'Erreur inconnue lors de l\'envoi Telegram',
        details: error.stack,
      };
    }
  }
}
