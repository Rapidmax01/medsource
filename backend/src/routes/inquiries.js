const express = require('express');
const prisma = require('../models');
const notificationService = require('../services/notification');
const { authenticate, requireSeller } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/inquiries
 * Create a new inquiry (buyer)
 */
router.post('/', authenticate, validate(schemas.createInquiry), async (req, res, next) => {
  try {
    const { productId, buyerName, buyerPhone, message, quantity, urgency } = req.body;

    // Get product and seller
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: { include: { user: true } } },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        buyerId: req.user.id,
        sellerId: product.sellerId,
        productId,
        buyerName,
        buyerPhone,
        message,
        quantity,
        urgency: urgency || 'routine',
      },
      include: {
        product: { select: { name: true, type: true, price: true } },
        seller: { select: { businessName: true, userId: true } },
      },
    });

    // Notify seller
    await notificationService.notifyInquiryReceived(inquiry);

    res.status(201).json({ inquiry });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inquiries
 * Get user's inquiries (buyer view)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = { buyerId: req.user.id };
    if (status) where.status = status;

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          product: { select: { name: true, type: true, price: true, images: true, bloodType: true } },
          seller: { select: { businessName: true, isVerified: true, businessPhone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.inquiry.count({ where }),
    ]);

    res.json({
      inquiries,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inquiries/seller
 * Get inquiries received by seller
 */
router.get('/seller', authenticate, requireSeller, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = { sellerId: req.user.seller.id };
    if (status) where.status = status;

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          product: { select: { name: true, type: true, price: true, images: true } },
          buyer: { select: { firstName: true, lastName: true, phone: true, state: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.inquiry.count({ where }),
    ]);

    res.json({
      inquiries,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/inquiries/:id/respond
 * Respond to an inquiry (seller)
 */
router.put('/:id/respond', authenticate, requireSeller, async (req, res, next) => {
  try {
    const { response } = req.body;

    if (!response || response.length < 5) {
      return res.status(400).json({ error: 'Response must be at least 5 characters' });
    }

    const inquiry = await prisma.inquiry.findFirst({
      where: { id: req.params.id, sellerId: req.user.seller.id },
      include: { product: true, seller: true },
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const updated = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: {
        response,
        status: 'RESPONDED',
        respondedAt: new Date(),
      },
      include: {
        product: { select: { name: true } },
        seller: { select: { businessName: true } },
      },
    });

    // Notify buyer
    await notificationService.notifyInquiryResponded(updated);

    res.json({ inquiry: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/inquiries/:id/close
 * Close an inquiry
 */
router.put('/:id/close', authenticate, async (req, res, next) => {
  try {
    const inquiry = await prisma.inquiry.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { buyerId: req.user.id },
          { sellerId: req.user.seller?.id },
        ],
      },
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const updated = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: { status: 'CLOSED' },
    });

    res.json({ inquiry: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
