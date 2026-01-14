import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrape product data from Zendo product page
 * @param {string} productSlug - Product slug from URL
 * @returns {Promise<Object>} Product data object
 */
export async function scrapeProduct(productSlug) {
  try {
    const url = `https://zendo.site/products/${productSlug}`;
    console.log(`🔍 Scraping: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Extract product name - try multiple selectors
    let productName =
      $('h1').first().text().trim() ||
      $('h1.product-title, h1[class*="title"], .product-name').first().text().trim() ||
      $('title').text().split('|')[0].trim() ||
      '';

    // Clean product name
    productName = productName.replace(/\s+/g, ' ').trim();

    // Extract price (keep original format with currency)
    const productPrice =
      $('.price, [class*="price"], .product-price, [data-price], [class*="money"]')
        .first()
        .text()
        .trim() || 
      $('[data-price]').attr('data-price') || '';

    // Extract images - improved selectors for Zendo/Shopify
    const productImages = [];
    const seenImages = new Set();
    
    // Try to extract from JSON-LD structured data first (Shopify)
    try {
      const jsonLd = $('script[type="application/ld+json"]').html();
      if (jsonLd) {
        const data = JSON.parse(jsonLd);
        if (data.image && Array.isArray(data.image)) {
          data.image.forEach((img) => {
            if (typeof img === 'string' && img.startsWith('http')) {
              const cleanImg = img.split('?')[0];
              if (!seenImages.has(cleanImg)) {
                productImages.push(cleanImg);
                seenImages.add(cleanImg);
              }
            }
          });
        } else if (data.image && typeof data.image === 'string') {
          const cleanImg = data.image.split('?')[0];
          if (!seenImages.has(cleanImg)) {
            productImages.push(cleanImg);
            seenImages.add(cleanImg);
          }
        }
      }
    } catch (e) {
      // JSON-LD parsing failed, continue with other methods
    }

    // Extract from img tags
    const imageSelectors = [
      'img[src*="product"]',
      'img[alt*="product"]',
      '.product-image img',
      '.gallery img',
      '[class*="product-image"] img',
      '[class*="product-media"] img',
      '[class*="media"] img',
      'img[src*="cdn"]',
      'img[src*="shopify"]',
      'img[src*="files"]',
      'main img',
      'article img',
    ];

    imageSelectors.forEach((selector) => {
      $(selector).each((i, elem) => {
        let src = $(elem).attr('src') || 
                  $(elem).attr('data-src') || 
                  $(elem).attr('data-lazy-src') ||
                  $(elem).attr('data-original') ||
                  $(elem).attr('data-image');
        
        if (src) {
          // Remove query parameters that might resize images
          src = src.split('?')[0].split('&')[0];
          
          // Convert relative URLs to absolute
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            src = 'https://zendo.site' + src;
          } else if (!src.startsWith('http')) {
            src = 'https://zendo.site/' + src;
          }
          
          // Avoid duplicates, small icons, and logos
          const cleanSrc = src.split('?')[0];
          if (!seenImages.has(cleanSrc) && 
              !cleanSrc.includes('icon') && 
              !cleanSrc.includes('logo') &&
              !cleanSrc.includes('placeholder') &&
              cleanSrc.length > 10) {
            productImages.push(cleanSrc);
            seenImages.add(cleanSrc);
          }
        }
      });
    });

    // Also try to extract from meta tags
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      const cleanOgImage = ogImage.split('?')[0];
      if (!seenImages.has(cleanOgImage)) {
        productImages.unshift(cleanOgImage); // Add at beginning as it's likely the main image
        seenImages.add(cleanOgImage);
      }
    }

    // Extract short description - try multiple selectors
    let productShortDesc =
      $('.product-short-desc, [class*="short-desc"], .excerpt, .summary, p:first-of-type')
        .first()
        .text()
        .trim() || '';

    // Extract full description - improved selectors
    let productFullDesc = '';
    const descSelectors = [
      '.product-description',
      '[class*="description"]',
      '.content',
      '.details',
      '[class*="product-details"]',
      'main p',
    ];

    descSelectors.forEach((selector) => {
      const desc = $(selector).text().trim();
      if (desc && desc.length > productFullDesc.length) {
        productFullDesc = desc;
      }
    });

    // If no short desc, use first part of full desc
    if (!productShortDesc && productFullDesc) {
      productShortDesc = productFullDesc.substring(0, 200).trim();
    }

    // Extract benefits
    const productBenefits = [];
    $('[class*="benefit"], [class*="advantage"], .benefits li, .features li').each(
      (i, elem) => {
        const benefit = $(elem).text().trim();
        if (benefit) productBenefits.push(benefit);
      }
    );

    // Extract usage instructions
    const productUsage =
      $('[class*="usage"], [class*="how-to"], .usage-instructions, .instructions')
        .text()
        .trim() || '';

    // Extract guarantee info
    const productGuarantee =
      $('[class*="guarantee"], [class*="warranty"], .guarantee, .warranty')
        .text()
        .trim() || '';

    // Extract delivery info
    const productDeliveryInfo =
      $('[class*="delivery"], [class*="shipping"], .delivery-info, .shipping-info')
        .text()
        .trim() || '';

    // Extract reviews
    const productReviews = [];
    $('.review, [class*="review"], .comment').each((i, elem) => {
      const author = $(elem).find('[class*="author"], .author, .name').text().trim() || 'Anonyme';
      const rating = parseInt($(elem).find('[class*="rating"], .rating, [data-rating]').attr('data-rating') || '5');
      const comment = $(elem).find('[class*="comment"], .comment-text, .text').text().trim() || '';
      const date = $(elem).find('[class*="date"], .date').text().trim() || '';

      if (comment) {
        productReviews.push({ author, rating, comment, date });
      }
    });

    // Extract stock information
    const stock = $('[class*="stock"], [class*="inventory"], .stock').text().trim() || '';
    
    // Extract rating and review count
    let rating = 0;
    let reviewCount = 0;
    const ratingText = $('[class*="rating"], [class*="review"]').text();
    const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
    if (ratingMatch) rating = parseFloat(ratingMatch[1]);
    
    const reviewMatch = $('text:contains("avis"), text:contains("reviews")').text().match(/(\d+)/);
    if (reviewMatch) reviewCount = parseInt(reviewMatch[1]);

    // Extract sections (h2/h3 with following paragraphs)
    const sections = [];
    $('h2, h3').each((i, elem) => {
      const title = $(elem).text().trim();
      const content = $(elem).next('p').text().trim() || 
                     $(elem).next().text().trim();
      
      if (title && content && title.length < 100) {
        sections.push({ title, content });
      }
    });

    // Extract FAQ items
    const faq = [];
    $('[class*="faq"], [class*="question"]').each((i, elem) => {
      const question = $(elem).find('h3, h4, [class*="question"]').text().trim() ||
                      $(elem).text().split('?')[0].trim() + '?';
      const answer = $(elem).find('p, [class*="answer"]').text().trim() ||
                    $(elem).text().split('→')[1]?.trim();
      
      if (question && answer && question.includes('?')) {
        faq.push({ question, answer });
      }
    });

    // Extract "Why it works" section
    let whyItWorks = null;
    $('h2, h3').each((i, elem) => {
      const text = $(elem).text().toLowerCase();
      if (text.includes('pourquoi') || text.includes('fonctionne') || text.includes('why')) {
        const title = $(elem).text().trim();
        const subtitle = $(elem).next('strong, b, h3').text().trim() || '';
        const content = $(elem).nextAll('p').first().text().trim();
        
        if (title && content) {
          whyItWorks = { title, subtitle, content };
          return false; // break
        }
      }
    });

    const productData = {
      productName: productName || `Produit ${productSlug}`,
      productPrice: productPrice || 'Prix non disponible',
      productImages: productImages.length > 0 ? productImages : [],
      productShortDesc: productShortDesc || productFullDesc.substring(0, 200) || '',
      productFullDesc: productFullDesc || productShortDesc || '',
      productBenefits: productBenefits.length > 0 ? productBenefits : [],
      productUsage: productUsage || '',
      productGuarantee: productGuarantee || '',
      productDeliveryInfo: productDeliveryInfo || '',
      productReviews: productReviews.length > 0 ? productReviews : [],
      stock: stock || 'En stock',
      rating: rating || 0,
      reviewCount: reviewCount || 0,
      sections: sections.length > 0 ? sections : [],
      faq: faq.length > 0 ? faq : [],
      whyItWorks: whyItWorks,
    };

    console.log(`✅ Scraped product: ${productData.productName}`);
    return productData;
  } catch (error) {
    console.error(`❌ Scraping error for ${productSlug}:`, error.message);
    throw new Error(
      `Impossible de récupérer les données du produit: ${error.message}`
    );
  }
}

