const express = require('express');
const prisma = require('../models');
const paymentService = require('../services/payment');
const notificationService = require('../services/notification');
const otpService = require('../services/otp');
const { authenticate, requireSeller } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', authenticate, validate(schemas.createOrder), async (req, res, next) => {
  try {
    const { items, deliveryAddress, deliveryState, deliveryCity, deliveryPhone, deliveryNotes } = req.body;

    // Validate items and calculate totals
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { seller: true },
    });

    if (products.length !== items.length) {
      return res.status(400).json({ error: 'Some products are no longer available' });
    }

    // Check stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product.inStock || product.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.quantity}`,
        });
      }
    }

    // Group items by seller (one order per seller)
    const sellerGroups = {};
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!sellerGroups[product.sellerId]) {
        sellerGroups[product.sellerId] = [];
      }
      sellerGroups[product.sellerId].push({ ...item, product });
    }

    const orders = [];

    // Create one order per seller
    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
      const subtotal = sellerItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const serviceFee = Math.round(subtotal * 0.025); // 2.5% service fee
      const totalAmount = subtotal + serviceFee;

      // Generate order number: MSN-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      const orderNumber = `MSN-${dateStr}-${random}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          buyerId: req.user.id,
          sellerId,
          subtotal,
          serviceFee,
          totalAmount,
          deliveryAddress,
          deliveryState,
          deliveryCity,
          deliveryPhone,
          deliveryNotes,
          items: {
            create: sellerItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
              totalPrice: item.product.price * item.quantity,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          seller: { include: { user: true } },
        },
      });

      // Decrease product stock
      for (const item of sellerItems) {
        const newQty = item.product.quantity - item.quantity;
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: newQty,
            inStock: newQty > 0,
          },
        });

        // Low stock alert
        if (newQty > 0 && newQty <= 3) {
          await notificationService.notifyLowStock({
            ...item.product,
            quantity: newQty,
            seller: { userId: order.seller.userId },
          });
        }
      }

      // Send notifications
      await notificationService.notifyOrderPlaced(order);

      orders.push(order);
    }

    res.status(201).json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
        status: o.status,
        itemCount: o.items.length,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders
 * Get buyer's orders
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { buyerId: req.user.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { name: true, type: true, images: true, bloodType: true } },
            },
          },
          seller: { select: { businessName: true, isVerified: true, state: true, city: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 * Get order detail
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { buyerId: req.user.id },
          { seller: { userId: req.user.id } },
        ],
      },
      include: {
        items: { include: { product: true } },
        seller: {
          select: {
            businessName: true, isVerified: true, businessPhone: true,
            whatsapp: true, state: true, city: true, address: true,
          },
        },
        buyer: { select: { firstName: true, lastName: true, phone: true } },
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (seller only)
 */
router.put('/:id/status', authenticate, requireSeller, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['READY_FOR_PICKUP', 'IN_TRANSIT', 'CANCELLED'],
      READY_FOR_PICKUP: ['IN_TRANSIT', 'DELIVERED'],
      IN_TRANSIT: ['DELIVERED'],
    };

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, sellerId: req.user.seller.id },
      include: {
        seller: { include: { user: true } },
        buyer: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${order.status} to ${status}`,
      });
    }

    const timestamps = {};
    if (status === 'CONFIRMED') timestamps.confirmedAt = new Date();
    if (status === 'IN_TRANSIT') timestamps.shippedAt = new Date();
    if (status === 'DELIVERED') timestamps.deliveredAt = new Date();
    if (status === 'CANCELLED') {
      timestamps.cancelledAt = new Date();
      // Restore stock on cancellation
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
            inStock: true,
          },
        });
      }
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, ...timestamps },
      include: {
        items: { include: { product: true } },
        seller: { include: { user: true } },
        buyer: true,
      },
    });

    // Send notifications
    const notifiers = {
      CONFIRMED: () => notificationService.notifyOrderConfirmed(updated),
      IN_TRANSIT: () => notificationService.notifyOrderShipped(updated),
      DELIVERED: () => notificationService.notifyOrderDelivered(updated),
    };
    if (notifiers[status]) await notifiers[status]();

    // Send SMS notification to buyer
    await otpService.sendOrderNotification(updated.buyer.phone, updated.orderNumber, status);

    res.json({ order: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/:id/pay
 * Initialize payment for an order
 */
router.post('/:id/pay', authenticate, async (req, res, next) => {
  try {
    const { provider = 'PAYSTACK' } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, buyerId: req.user.id, paymentStatus: 'PENDING' },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or already paid' });
    }

    const reference = paymentService.generateReference();

    const result = await paymentService.initializePayment({
      email: req.user.email || `${req.user.phone}@medsource.ng`,
      amount: order.totalAmount,
      reference,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        buyerId: req.user.id,
      },
      customerName: `${req.user.firstName} ${req.user.lastName}`,
      customerPhone: req.user.phone,
      provider,
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: result.provider,
        reference,
        amount: order.totalAmount,
        status: 'PENDING',
      },
    });

    // Update order with payment reference
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: reference, paymentProvider: result.provider },
    });

    res.json({
      success: true,
      paymentUrl: result.authorizationUrl || result.paymentLink,
      reference,
      provider: result.provider,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
