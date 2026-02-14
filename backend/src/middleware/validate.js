/**
 * Simple request validation middleware
 * Usage: validate(schema) where schema defines required fields
 */

const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
        if (rules.type === 'number' && typeof value !== 'number') {
          errors.push(`${field} must be a number`);
        }
        if (rules.type === 'array' && !Array.isArray(value)) {
          errors.push(`${field} must be an array`);
        }
        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
        if (rules.min && typeof value === 'number' && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }
        if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  sendOtp: {
    phone: { required: true, type: 'string', pattern: /^\+\d{7,15}$/ },
  },
  verifyOtp: {
    phone: { required: true, type: 'string' },
    code: { required: true, type: 'string', minLength: 4, maxLength: 6 },
  },
  register: {
    phone: { required: true, type: 'string' },
    firstName: { required: true, type: 'string', minLength: 2 },
    lastName: { required: true, type: 'string', minLength: 2 },
    accountType: { required: false, type: 'string', enum: ['INDIVIDUAL', 'HOSPITAL', 'PHARMACY', 'BLOOD_BANK', 'DISTRIBUTOR'] },
  },
  createProduct: {
    name: { required: true, type: 'string', minLength: 3 },
    type: { required: true, type: 'string', enum: ['PHARMACEUTICAL', 'BLOOD_PRODUCT'] },
    price: { required: true, type: 'number', min: 0 },
    quantity: { required: true, type: 'number', min: 0 },
  },
  createOrder: {
    items: { required: true, type: 'array' },
    deliveryAddress: { required: true, type: 'string' },
    deliveryState: { required: true, type: 'string' },
    deliveryPhone: { required: true, type: 'string' },
  },
  createInquiry: {
    productId: { required: true, type: 'string' },
    buyerName: { required: true, type: 'string' },
    buyerPhone: { required: true, type: 'string' },
    message: { required: true, type: 'string', minLength: 10 },
  },
};

module.exports = { validate, schemas };
