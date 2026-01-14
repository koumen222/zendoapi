/**
 * Utilitaire pour déclencher les événements Meta Pixel
 */

/**
 * Vérifie si le pixel Meta est chargé
 */
const isPixelLoaded = () => {
  return typeof window !== 'undefined' && window.fbq;
};

/**
 * Déclenche un événement Purchase
 * @param {Object} params - Paramètres de l'événement
 * @param {number} params.value - Valeur de la commande
 * @param {string} params.currency - Devise (défaut: 'XAF')
 * @param {string} params.orderId - ID de la commande
 */
export const trackPurchase = ({ value, currency = 'XAF', orderId }) => {
  if (!isPixelLoaded()) {
    console.warn('[Meta Pixel] Pixel not loaded, skipping Purchase event');
    return;
  }

  try {
    window.fbq('track', 'Purchase', {
      value: parseFloat(value),
      currency: currency,
      content_name: 'Hismile Serum',
      content_ids: ['hismile_serum'],
      content_type: 'product',
      content_category: 'Beauty & Health',
      order_id: orderId,
    });
    console.log('[Meta Pixel] Purchase event tracked', { value, currency, orderId });
  } catch (error) {
    console.error('[Meta Pixel] Error tracking Purchase:', error);
  }
};

/**
 * Déclenche un événement InitiateCheckout
 */
export const trackInitiateCheckout = () => {
  if (!isPixelLoaded()) {
    console.warn('[Meta Pixel] Pixel not loaded, skipping InitiateCheckout event');
    return;
  }

  try {
    window.fbq('track', 'InitiateCheckout');
    console.log('[Meta Pixel] InitiateCheckout event tracked');
  } catch (error) {
    console.error('[Meta Pixel] Error tracking InitiateCheckout:', error);
  }
};

/**
 * Déclenche un événement ViewContent
 * @param {Object} params - Paramètres de l'événement
 * @param {string} params.contentName - Nom du contenu
 * @param {string} params.contentId - ID du contenu
 */
export const trackViewContent = ({ contentName, contentId }) => {
  if (!isPixelLoaded()) {
    console.warn('[Meta Pixel] Pixel not loaded, skipping ViewContent event');
    return;
  }

  try {
    window.fbq('track', 'ViewContent', {
      content_name: contentName,
      content_ids: [contentId],
      content_type: 'product',
      content_category: 'Beauty & Health',
    });
    console.log('[Meta Pixel] ViewContent event tracked', { contentName, contentId });
  } catch (error) {
    console.error('[Meta Pixel] Error tracking ViewContent:', error);
  }
};
