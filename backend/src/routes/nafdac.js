const express = require('express');
const nafdacService = require('../services/nafdac');
const { authenticate, requireSeller } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/nafdac/verify/:number
 * Verify a single NAFDAC number
 */
router.get('/verify/:number', authenticate, async (req, res, next) => {
  try {
    const result = await nafdacService.verify(req.params.number);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/nafdac/verify-bulk
 * Verify multiple NAFDAC numbers
 */
router.post('/verify-bulk', authenticate, requireSeller, async (req, res, next) => {
  try {
    const { numbers } = req.body;

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({ error: 'Provide an array of NAFDAC numbers' });
    }

    if (numbers.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 numbers per request' });
    }

    const results = await nafdacService.verifyBulk(numbers);
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/nafdac/validate-format/:number
 * Quick format validation only (no lookup)
 */
router.get('/validate-format/:number', (req, res) => {
  const result = nafdacService.validateFormat(req.params.number);
  res.json(result);
});

/**
 * GET /api/nafdac/category/:number
 * Get category info from NAFDAC number
 */
router.get('/category/:number', (req, res) => {
  const info = nafdacService.getCategoryInfo(req.params.number);
  res.json(info);
});

module.exports = router;
