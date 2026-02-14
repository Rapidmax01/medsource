const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for OTP requests
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 OTP requests per 10 minutes
  message: { error: 'Too many OTP requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment webhook - more lenient
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: { error: 'Rate limit exceeded' },
});

module.exports = { apiLimiter, otpLimiter, webhookLimiter };
