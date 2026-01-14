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
    
    if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
      console.warn("[META-CAPI] Missing META_PIXEL_ID or META_ACCESS_TOKEN");
      return { success: false, message: 'Configuration manquante' };
    }

    const eventData = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: url,
          user_data: {
            client_ip_address: ip,
            client_user_agent: userAgent,
          },
          custom_data: {
            currency,
            value: parseFloat(value),
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
    }

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`,
      eventData,
      {
        params: {
          access_token: META_ACCESS_TOKEN,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000, // Timeout de 5 secondes
      }
    );

    console.log("[META-CAPI] Purchase sent");
    
    return { 
      success: true, 
      data: response.data,
      orderId 
    };
    
  } catch (error) {
    console.error('[META-CAPI] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Ne pas bloquer le flux en cas d'erreur CAPI
    return { 
      success: false, 
      error: error.message,
      orderId 
    };
  }
};