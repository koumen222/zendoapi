import axios from 'axios';

/**
 * Envoie un événement Purchase à Meta CAPI
 */
export const sendMetaPurchase = async ({ 
  ip, 
  userAgent, 
  value, 
  url, 
  currency = 'XAF',
  orderId 
}) => {
  try {
    const META_PIXEL_ID = process.env.META_PIXEL_ID;
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    
    // Log de vérification de la configuration
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 META CAPI - Configuration Check');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔑 META_PIXEL_ID:', META_PIXEL_ID ? `${META_PIXEL_ID.substring(0, 4)}...` : '❌ NOT SET');
    console.log('🔑 META_ACCESS_TOKEN:', META_ACCESS_TOKEN ? `${META_ACCESS_TOKEN.substring(0, 10)}...` : '❌ NOT SET');
    
    if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
      console.warn("⚠️  [META-CAPI] Missing configuration:");
      if (!META_PIXEL_ID) console.warn("   - META_PIXEL_ID is not set");
      if (!META_ACCESS_TOKEN) console.warn("   - META_ACCESS_TOKEN is not set");
      console.warn("   → Add these variables in Railway environment settings");
      return { success: false, message: 'Configuration manquante' };
    }

    // Validation des données
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      console.error("❌ [META-CAPI] Invalid value:", value);
      return { success: false, message: 'Valeur invalide' };
    }

    const eventData = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: url || 'https://b12068c0.zendof.pages.dev',
          user_data: {
            client_ip_address: ip || '',
            client_user_agent: userAgent || '',
          },
          custom_data: {
            currency: currency || 'XAF',
            value: numericValue,
            content_type: 'product',
            content_name: 'Hismile Serum',
            content_ids: ['hismile_serum'],
            content_category: 'Beauty & Health',
            order_id: orderId || `order_${Date.now()}`,
          }
        }
      ],
    };

    const testCode = process.env.META_TEST_EVENT_CODE;
    if (testCode) {
      eventData.test_event_code = testCode;
      console.log('🧪 [META-CAPI] Test event code enabled');
    }

    // Log des données avant envoi
    console.log('📤 [META-CAPI] Sending Purchase event:', {
      pixel_id: META_PIXEL_ID,
      order_id: orderId,
      value: numericValue,
      currency: currency,
      url: url,
      ip: ip ? `${ip.substring(0, 10)}...` : 'N/A',
    });

    const apiUrl = `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`;
    const response = await axios.post(
      apiUrl,
      eventData,
      {
        params: {
          access_token: META_ACCESS_TOKEN,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // Timeout de 10 secondes (augmenté)
      }
    );

    console.log("✅ [META-CAPI] Purchase event sent successfully");
    console.log("📊 [META-CAPI] Response:", {
      events_received: response.data?.events_received,
      messages: response.data?.messages,
    });
    
    return { 
      success: true, 
      data: response.data,
      orderId 
    };
    
  } catch (error) {
    console.error('\n❌ [META-CAPI] Error sending Purchase event:');
    console.error('   Message:', error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Status Text:', error.response?.statusText);
    
    if (error.response?.data) {
      console.error('   Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Erreurs courantes et solutions
    if (error.response?.status === 400) {
      console.error('   💡 Possible causes:');
      console.error('      - Invalid pixel ID');
      console.error('      - Invalid access token');
      console.error('      - Invalid event data format');
    } else if (error.response?.status === 401) {
      console.error('   💡 Possible causes:');
      console.error('      - Expired or invalid access token');
      console.error('      - Token does not have required permissions');
    } else if (error.code === 'ECONNABORTED') {
      console.error('   💡 Request timeout - Meta API took too long to respond');
    }
    
    // Ne pas bloquer le flux en cas d'erreur CAPI
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      orderId 
    };
  }
};