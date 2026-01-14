/**
 * Extract the first word from a text string
 * @param {string} text - The text to extract the first word from
 * @returns {string} - The first word or the original text if empty
 */
export const getFirstWord = (text) => {
  if (!text || typeof text !== 'string') return 'N/A';
  const trimmed = text.trim();
  if (!trimmed) return 'N/A';
  const firstWord = trimmed.split(/\s+/)[0];
  return firstWord || trimmed;
};
