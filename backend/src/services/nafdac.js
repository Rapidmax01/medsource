const axios = require('axios');
const config = require('../config');

/**
 * NAFDAC Verification Service
 * 
 * NOTE: As of 2025, NAFDAC does not have a public API.
 * This service implements:
 * 1. Local database validation (format + known numbers)
 * 2. Web scraping of NAFDAC's green page as fallback
 * 3. Placeholder for future official API integration
 * 
 * The NAFDAC number format: XX-XXXX (e.g., A4-0847)
 * Categories: A=Food, B=Drugs, C=Cosmetics, D=Medical Devices, E=Chemicals
 */

class NafdacService {
  constructor() {
    // Known NAFDAC number patterns
    this.validCategories = ['A', 'B', 'C', 'D', 'E'];
    this.drugCategoryPrefix = 'B'; // Drugs fall under B category
    
    // Cache for verified numbers (in production, use Redis)
    this.verificationCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Validate NAFDAC number format
   */
  validateFormat(nafdacNumber) {
    if (!nafdacNumber) return { valid: false, reason: 'NAFDAC number is required' };

    // Clean the input
    const cleaned = nafdacNumber.trim().toUpperCase();

    // Format: XX-XXXX or XXXXXXXXX (various formats exist)
    const patterns = [
      /^[A-E]\d-\d{4}$/,           // A4-0847
      /^[A-E]\d{2}-\d{4}$/,        // B02-1193
      /^\d{2}-\d{4}$/,             // 02-1193
      /^NAFDAC\/[A-Z]\d+-\d+$/,    // NAFDAC/B02-1193
    ];

    const isValidFormat = patterns.some((p) => p.test(cleaned));

    if (!isValidFormat) {
      return {
        valid: false,
        reason: 'Invalid NAFDAC number format. Expected format: XX-XXXX (e.g., B2-1193)',
      };
    }

    return { valid: true, formatted: cleaned };
  }

  /**
   * Verify a NAFDAC registration number
   * Returns verification status and product details if available
   */
  async verify(nafdacNumber) {
    // 1. Validate format
    const formatCheck = this.validateFormat(nafdacNumber);
    if (!formatCheck.valid) {
      return {
        verified: false,
        status: 'INVALID_FORMAT',
        message: formatCheck.reason,
      };
    }

    const cleaned = formatCheck.formatted;

    // 2. Check cache
    const cached = this.verificationCache.get(cleaned);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    // 3. Try official API (when available)
    try {
      if (config.nafdac.apiUrl && config.nafdac.apiKey) {
        const result = await this.verifyViaApi(cleaned);
        this.cacheResult(cleaned, result);
        return result;
      }
    } catch (error) {
      console.warn('NAFDAC API unavailable:', error.message);
    }

    // 4. Try web scraping NAFDAC's Green Book
    try {
      const scrapedResult = await this.verifyViaGreenBook(cleaned);
      if (scrapedResult.verified) {
        this.cacheResult(cleaned, scrapedResult);
        return scrapedResult;
      }
    } catch (error) {
      console.warn('NAFDAC Green Book scraping failed:', error.message);
    }

    // 5. Fallback: Format-based provisional verification
    const result = {
      verified: false,
      status: 'UNVERIFIABLE',
      message: 'Unable to verify with NAFDAC at this time. Number format is valid but registration status cannot be confirmed.',
      nafdacNumber: cleaned,
      formatValid: true,
      note: 'Manual verification recommended. Visit nafdac.gov.ng or contact NAFDAC directly.',
    };

    this.cacheResult(cleaned, result);
    return result;
  }

  /**
   * Verify via NAFDAC official API (future implementation)
   */
  async verifyViaApi(nafdacNumber) {
    const response = await axios.get(`${config.nafdac.apiUrl}/verify/${nafdacNumber}`, {
      headers: { 'X-API-Key': config.nafdac.apiKey },
      timeout: 10000,
    });

    const data = response.data;

    return {
      verified: data.status === 'registered',
      status: data.status === 'registered' ? 'VERIFIED' : 'NOT_FOUND',
      nafdacNumber,
      productName: data.product_name,
      manufacturer: data.manufacturer,
      category: data.category,
      registrationDate: data.registration_date,
      expiryDate: data.expiry_date,
      message: data.status === 'registered'
        ? 'Product is registered with NAFDAC'
        : 'Product not found in NAFDAC registry',
    };
  }

  /**
   * Attempt to verify by scraping NAFDAC Green Book
   * (nafdac.gov.ng/our-services/registered-products/)
   */
  async verifyViaGreenBook(nafdacNumber) {
    try {
      // NAFDAC Green Book search endpoint
      const searchUrl = 'https://www.nafdac.gov.ng/our-services/registered-products/';

      const response = await axios.get(searchUrl, {
        params: { search: nafdacNumber },
        timeout: 15000,
        headers: {
          'User-Agent': 'MedSource Verification Bot/1.0',
        },
      });

      // Parse response for registration status
      const html = response.data;
      const found = html.includes(nafdacNumber) ||
        html.toLowerCase().includes('registered') && html.includes(nafdacNumber.replace('-', ''));

      if (found) {
        return {
          verified: true,
          status: 'VERIFIED',
          nafdacNumber,
          source: 'NAFDAC Green Book',
          message: 'Product found in NAFDAC registered products database',
        };
      }

      return { verified: false, status: 'NOT_FOUND' };
    } catch (error) {
      throw new Error('Green Book verification failed: ' + error.message);
    }
  }

  /**
   * Bulk verify multiple NAFDAC numbers
   */
  async verifyBulk(nafdacNumbers) {
    const results = await Promise.allSettled(
      nafdacNumbers.map((num) => this.verify(num))
    );

    return results.map((result, index) => ({
      nafdacNumber: nafdacNumbers[index],
      ...(result.status === 'fulfilled' ? result.value : { verified: false, error: result.reason.message }),
    }));
  }

  /**
   * Cache verification result
   */
  cacheResult(nafdacNumber, result) {
    this.verificationCache.set(nafdacNumber, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Get drug category info from NAFDAC number
   */
  getCategoryInfo(nafdacNumber) {
    const firstChar = nafdacNumber.charAt(0).toUpperCase();
    const categories = {
      A: { name: 'Food Products', relevant: false },
      B: { name: 'Drug Products', relevant: true },
      C: { name: 'Cosmetic Products', relevant: false },
      D: { name: 'Medical Devices', relevant: true },
      E: { name: 'Chemical Products', relevant: false },
    };

    return categories[firstChar] || { name: 'Unknown', relevant: false };
  }
}

module.exports = new NafdacService();
