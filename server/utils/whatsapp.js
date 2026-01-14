import axios from 'axios';

// Les variables d'environnement sont déjà chargées par server/index.js

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // Phone Number ID: 913249341870874 (Numéro qui envoie: +1 555 190 7419)
const ADMIN_PHONE = process.env.ADMIN_PHONE || '237676463725'; // Numéro qui reçoit: +237 6 76 46 37 25

/**
 * Envoie un message WhatsApp via l'API officielle Meta
 * @param {Object} orderData - Données de la commande
 * @param {string} orderData.name - Nom du client
 * @param {string} orderData.phone - Téléphone du client
 * @param {string} orderData.product - Nom du produit
 * @param {string} orderData.price - Prix de la commande
 * @param {string} orderData.city - Ville du client
 * @returns {Promise<Object>} Réponse de l'API WhatsApp
 */
export async function sendWhatsAppNotification(orderData) {
  // Logs visibles dans le terminal de l'éditeur
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📱 DÉBUT ENVOI WHATSAPP');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('📋 Données de commande reçues:', JSON.stringify(orderData, null, 2));

  try {
    // Validation des variables d'environnement
    console.log('\n🔍 Vérification des variables d\'environnement...');
    
    if (!ACCESS_TOKEN) {
      console.error('❌ WHATSAPP_ACCESS_TOKEN non défini dans .env');
      throw new Error('WHATSAPP_ACCESS_TOKEN non défini dans .env');
    } else {
      console.log('✅ WHATSAPP_ACCESS_TOKEN: Présent (longueur:', ACCESS_TOKEN.length, 'caractères)');
    }
    
    if (!PHONE_NUMBER_ID) {
      console.error('❌ WHATSAPP_PHONE_NUMBER_ID non défini dans .env');
      throw new Error('WHATSAPP_PHONE_NUMBER_ID non défini dans .env');
    } else {
      console.log('✅ WHATSAPP_PHONE_NUMBER_ID:', PHONE_NUMBER_ID);
    }
    
    if (!ADMIN_PHONE) {
      console.error('❌ ADMIN_PHONE non défini dans .env');
      throw new Error('ADMIN_PHONE non défini dans .env');
    } else {
      console.log('✅ ADMIN_PHONE:', ADMIN_PHONE);
    }

    // Formatage du numéro de téléphone qui reçoit (supprimer les espaces et le +)
    // Format attendu par WhatsApp API: 237676463725 (sans + et sans espaces)
    const formattedPhone = ADMIN_PHONE.replace(/\s+/g, '').replace(/\+/g, '');
    console.log('📞 Numéro qui ENVOIE (Phone Number ID):', PHONE_NUMBER_ID);
    console.log('📞 Numéro qui REÇOIT (formaté):', formattedPhone);
    console.log('📞 Numéro qui REÇOIT (original):', ADMIN_PHONE);

    // Construction du message avec emojis
    const message = `🛒 NOUVELLE COMMANDE

👤 Nom: ${orderData.name}
📞 Téléphone: ${orderData.phone}
📦 Produit: ${orderData.product}
💰 Prix: ${orderData.price}
📍 Ville: ${orderData.city}`;

    console.log('\n📝 Message WhatsApp construit:');
    console.log('─'.repeat(50));
    console.log(message);
    console.log('─'.repeat(50));
    console.log('📏 Longueur du message:', message.length, 'caractères');

    // URL de l'API WhatsApp
    const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;
    console.log('\n🌐 URL de l\'API WhatsApp:', url);

    // Corps de la requête
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    };

    console.log('\n📦 Payload de la requête:', JSON.stringify(payload, null, 2));

    // Headers avec le token d'accès
    const headers = {
      'Authorization': `Bearer ${ACCESS_TOKEN.substring(0, 20)}...`,
      'Content-Type': 'application/json',
    };
    console.log('\n🔐 Headers (token masqué):', JSON.stringify(headers, null, 2));

    console.log('\n🚀 Envoi de la requête à l\'API WhatsApp...');
    const startTime = Date.now();

    // Envoi de la requête
    const response = await axios.post(url, payload, { 
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ MESSAGE WHATSAPP ENVOYÉ AVEC SUCCÈS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⏱️  Temps de réponse:', duration, 'ms');
    console.log('📨 Message ID:', response.data.messages?.[0]?.id || 'N/A');
    console.log('📊 Réponse complète de l\'API:', JSON.stringify(response.data, null, 2));
    console.log('📱 Statut HTTP:', response.status, response.statusText);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n');

    return {
      success: true,
      messageId: response.data.messages?.[0]?.id || null,
      data: response.data,
      duration,
    };
  } catch (error) {
    console.error('\n');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ ERREUR LORS DE L\'ENVOI WHATSAPP');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('🕐 Timestamp:', new Date().toISOString());
    
    if (error.response) {
      // Erreur de l'API WhatsApp
      console.error('📡 Réponse HTTP reçue:');
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('   Données d\'erreur:', JSON.stringify(error.response.data, null, 2));
      
      const errorData = error.response.data;
      console.error('\n🔍 Détails de l\'erreur API:');
      console.error('   Code:', errorData.error?.code || 'N/A');
      console.error('   Type:', errorData.error?.type || 'N/A');
      console.error('   Message:', errorData.error?.message || 'N/A');
      console.error('   Subcode:', errorData.error?.error_subcode || 'N/A');
      
      if (errorData.error?.error_data) {
        console.error('   Données supplémentaires:', JSON.stringify(errorData.error.error_data, null, 2));
      }
      
      console.error('═══════════════════════════════════════════════════════════');
      console.error('\n');
      
      return {
        success: false,
        error: errorData.error?.message || 'Erreur API WhatsApp',
        code: errorData.error?.code,
        status: error.response.status,
        details: errorData,
      };
    } else if (error.request) {
      // Pas de réponse reçue
      console.error('🌐 Aucune réponse reçue du serveur WhatsApp');
      console.error('   Requête envoyée:', error.config?.url || 'N/A');
      console.error('   Méthode:', error.config?.method || 'N/A');
      console.error('   Message:', error.message);
      console.error('═══════════════════════════════════════════════════════════');
      console.error('\n');
      
      return {
        success: false,
        error: 'Aucune réponse du serveur WhatsApp',
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
        error: error.message || 'Erreur inconnue lors de l\'envoi WhatsApp',
        details: error.stack,
      };
    }
  }
}
