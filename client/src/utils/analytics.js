import { api } from './api';

/**
 * Track a page visit
 */
export const trackVisit = async (path) => {
  try {
    await api.post('/api/analytics/track-visit', {
      path: path || window.location.pathname,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || '',
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.debug('Visit tracking failed:', error);
  }
};

/**
 * Track page view on component mount
 */
export const usePageTracking = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    trackVisit(path);
  }
};
