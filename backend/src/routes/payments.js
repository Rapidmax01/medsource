const express = require('express');
const prisma = require('../models');
const paymentService = require('../services/payment');
const notificationService = require('../services/notification');
const emailService = require('../services/email');
const { authenticate } = require('../middleware/auth');
const { webhookLimiter } = require('../middleware/rateLimit');

const router = express.Router();

/**
 * POST /api/payments/webhook/paystack
 * Paystack webhook handler
 */
router.post('/webhook/paystack', webhookLimiter, async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-paystack-signature'];
    const body = req.body.toString();

    if (!paymentService.verifyPaystackWebhook(body, signature)) {
      console.warn('Invalid Paystack webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook:', event.event);

    if (event.event === 'charge.success') {
      await handleSuccessfulPayment(event.data.reference, 'PAYSTACK', event.data);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(200).json({ received: true }); // Still acknowledge
  }
});

/**
 * POST /api/payments/webhook/flutterwave
 * Flutterwave webhook handler
 */
router.post('/webhook/flutterwave', webhookLimiter, async (req, res) => {
  try {
    // Verify webhook
    const signature = req.headers['verif-hash'];
    if (!paymentService.verifyFlutterwaveWebhook(signature)) {
      console.warn('Invalid Flutterwave webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('Flutterwave webhook:', event.event);

    if (event.event === 'charge.completed' && event.data.status === 'successful') {
      // Verify the transaction
      const verification = await paymentService.verifyFlutterwave(event.data.id);
      if (verification.success) {
        await handleSuccessfulPayment(event.data.tx_ref, 'FLUTTERWAVE', event.data);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    res.status(200).json({ received: true });
  }
});

/**
 * GET /api/payments/verify/:reference
 * Verify payment status (called from frontend after redirect)
 */
router.get('/verify/:reference', authenticate, async (req, res, next) => {
  try {
    const { reference } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { order: true },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // If still pending, verify with provider
    if (payment.status === 'PENDING') {
      let verification;
      if (payment.provider === 'PAYSTACK') {
        verification = await paymentService.verifyPaystack(reference);
      } else {
        // For Flutterwave, we need the transaction ID from query params
        const { transaction_id } = req.query;
        if (transaction_id) {
          verification = await paymentService.verifyFlutterwave(transaction_id);
        }
      }

      if (verification?.success) {
        await handleSuccessfulPayment(reference, payment.provider, verification);
        // Refresh payment data
        const updated = await prisma.payment.findUnique({
          where: { reference },
          include: { order: true },
        });
        return res.json({ payment: updated, verified: true });
      }
    }

    res.json({ payment, verified: payment.status === 'PAID' });
  } catch (error) {
    next(error);
  }
});

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(reference, provider, providerData) {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: {
      order: {
        include: {
          seller: { include: { user: true } },
          buyer: true,
          items: true,
        },
      },
    },
  });

  if (!payment || payment.status === 'PAID') return;

  // Update payment record
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      providerData: providerData || {},
    },
  });

  // Update order
  await prisma.order.update({
    where: { id: payment.orderId },
    data: {
      paymentStatus: 'PAID',
      paidAt: new Date(),
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  });

  // Update seller stats and earnings
  await prisma.seller.update({
    where: { id: payment.order.sellerId },
    data: {
      totalSales: { increment: 1 },
      totalEarnings: { increment: payment.order.sellerEarnings || 0 },
      totalCommissionPaid: { increment: payment.order.commission || 0 },
      pendingBalance: { increment: payment.order.sellerEarnings || 0 },
    },
  });

  // Send notifications
  await notificationService.notifyPaymentReceived(payment.order);
  await notificationService.notifyOrderConfirmed(payment.order);

  // Send payment receipt email (fire-and-forget)
  const buyerEmail = payment.order.buyer?.email;
  if (buyerEmail) {
    emailService.sendPaymentReceipt(buyerEmail, payment.order, payment).catch(() => {});
  }

  console.log(`✅ Payment confirmed: ${reference} - ₦${payment.amount}`);
}

module.exports = router;
