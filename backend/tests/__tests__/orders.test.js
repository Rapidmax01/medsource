// Set env before anything
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRY = '30d';

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret-key';

// ─── Mock Prisma ────────────────────────────────────────────────
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  seller: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  orderItem: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  otpCode: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  notification: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
};

jest.mock('../../src/models', () => mockPrisma);

// ─── Mock Payment Service ───────────────────────────────────────
jest.mock('../../src/services/payment', () => ({
  initializePayment: jest.fn().mockResolvedValue({
    success: true,
    provider: 'PAYSTACK',
    authorizationUrl: 'https://paystack.com/pay/test-ref',
    reference: 'MSN-TEST-REF',
  }),
  generateReference: jest.fn().mockReturnValue('MSN-TEST-REF'),
}));

// ─── Mock Notification Service ──────────────────────────────────
jest.mock('../../src/services/notification', () => ({
  notifyOrderPlaced: jest.fn().mockResolvedValue(null),
  notifyOrderConfirmed: jest.fn().mockResolvedValue(null),
  notifyOrderShipped: jest.fn().mockResolvedValue(null),
  notifyOrderDelivered: jest.fn().mockResolvedValue(null),
  notifyLowStock: jest.fn().mockResolvedValue(null),
  notifyPaymentReceived: jest.fn().mockResolvedValue(null),
  notify: jest.fn().mockResolvedValue(null),
}));

// ─── Mock OTP Service ───────────────────────────────────────────
jest.mock('../../src/services/otp', () => ({
  sendOtp: jest.fn().mockResolvedValue({ success: true }),
  formatPhone: jest.fn((phone) => {
    if (phone.startsWith('+234')) return phone;
    if (phone.startsWith('0')) return '+234' + phone.slice(1);
    return '+234' + phone;
  }),
  generateCode: jest.fn().mockReturnValue('123456'),
  sendOrderNotification: jest.fn().mockResolvedValue(undefined),
}));

// ─── Mock Rate Limiter ──────────────────────────────────────────
jest.mock('../../src/middleware/rateLimit', () => ({
  apiLimiter: (req, res, next) => next(),
  otpLimiter: (req, res, next) => next(),
  webhookLimiter: (req, res, next) => next(),
}));

// ─── Mock firebase-admin ────────────────────────────────────────
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  messaging: jest.fn(() => ({ send: jest.fn(), sendEachForMulticast: jest.fn() })),
}));

const request = require('supertest');
const app = require('../../src/server');
const paymentService = require('../../src/services/payment');
const notificationService = require('../../src/services/notification');
const otpService = require('../../src/services/otp');

// ─── Test Data ──────────────────────────────────────────────────
const testSeller = {
  id: 'seller-1',
  businessName: 'Lagos Pharma Ltd',
  isVerified: true,
  state: 'Lagos',
  city: 'Ikeja',
  userId: 'seller-user-id',
  user: { id: 'seller-user-id', phone: '+2348099999999' },
};

const testSellerUser = {
  id: 'seller-user-id',
  phone: '+2348099999999',
  firstName: 'Seller',
  lastName: 'User',
  email: 'seller@test.com',
  role: 'SELLER',
  isActive: true,
  isVerified: true,
  seller: testSeller,
};

const testBuyerUser = {
  id: 'buyer-user-id',
  phone: '+2348012345678',
  firstName: 'Buyer',
  lastName: 'User',
  email: 'buyer@test.com',
  role: 'BUYER',
  isActive: true,
  isVerified: true,
  seller: null,
};

const sampleProduct = {
  id: 'product-1',
  name: 'Rituximab 500mg',
  type: 'PHARMACEUTICAL',
  price: 250000,
  quantity: 10,
  inStock: true,
  isActive: true,
  sellerId: testSeller.id,
  seller: testSeller,
};

const sampleOrder = {
  id: 'order-1',
  orderNumber: 'MSN-20260214-ABCD',
  buyerId: testBuyerUser.id,
  sellerId: testSeller.id,
  subtotal: 500000,
  serviceFee: 12500,
  totalAmount: 512500,
  status: 'PENDING',
  paymentStatus: 'PENDING',
  deliveryAddress: '10 Allen Avenue, Ikeja',
  deliveryState: 'Lagos',
  deliveryCity: 'Ikeja',
  deliveryPhone: '+2348012345678',
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      quantity: 2,
      unitPrice: 250000,
      totalPrice: 500000,
      product: sampleProduct,
    },
  ],
  seller: testSeller,
  buyer: testBuyerUser,
  payment: null,
  createdAt: new Date(),
};

const buyerToken = jwt.sign({ userId: testBuyerUser.id }, JWT_SECRET);
const sellerToken = jwt.sign({ userId: testSellerUser.id }, JWT_SECRET);

describe('Order Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // POST /api/orders
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/orders', () => {
    it('should create order with valid items', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);
      mockPrisma.product.findMany.mockResolvedValue([sampleProduct]);
      mockPrisma.order.create.mockResolvedValue(sampleOrder);
      mockPrisma.product.update.mockResolvedValue({ ...sampleProduct, quantity: 8 });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          items: [{ productId: 'product-1', quantity: 2 }],
          deliveryAddress: '10 Allen Avenue, Ikeja',
          deliveryState: 'Lagos',
          deliveryCity: 'Ikeja',
          deliveryPhone: '+2348012345678',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('orders');
      expect(res.body.orders).toHaveLength(1);
      expect(notificationService.notifyOrderPlaced).toHaveBeenCalled();
    });

    it('should return 400 for missing items', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          deliveryAddress: '10 Allen Avenue',
          deliveryState: 'Lagos',
          deliveryPhone: '+2348012345678',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 for missing delivery fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          items: [{ productId: 'product-1', quantity: 2 }],
          // Missing deliveryAddress, deliveryState, deliveryPhone
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ productId: 'product-1', quantity: 2 }],
          deliveryAddress: '10 Allen Avenue',
          deliveryState: 'Lagos',
          deliveryPhone: '+2348012345678',
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 when product is unavailable', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);
      mockPrisma.product.findMany.mockResolvedValue([]); // No products found

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          items: [{ productId: 'nonexistent-product', quantity: 1 }],
          deliveryAddress: '10 Allen Avenue',
          deliveryState: 'Lagos',
          deliveryPhone: '+2348012345678',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('no longer available');
    });

    it('should return 400 for insufficient stock', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);
      mockPrisma.product.findMany.mockResolvedValue([
        { ...sampleProduct, quantity: 1, inStock: true },
      ]);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          items: [{ productId: 'product-1', quantity: 5 }],
          deliveryAddress: '10 Allen Avenue',
          deliveryState: 'Lagos',
          deliveryPhone: '+2348012345678',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Insufficient stock');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/orders
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/orders', () => {
    it('should return buyer orders', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);
      mockPrisma.order.findMany.mockResolvedValue([sampleOrder]);
      mockPrisma.order.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('orders');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.total).toBe(1);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
    });

    it('should filter by status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/orders?status=CONFIRMED')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'CONFIRMED' }),
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/orders/:id
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/orders/:id', () => {
    it('should return order detail for buyer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);
      mockPrisma.order.findFirst.mockResolvedValue(sampleOrder);

      const res = await request(app)
        .get('/api/orders/order-1')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('order');
      expect(res.body.order.orderNumber).toBe('MSN-20260214-ABCD');
    });

    it('should return 404 for nonexistent order', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/orders/nonexistent')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/orders/order-1');
      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PUT /api/orders/:id/status
  // ═══════════════════════════════════════════════════════════════
  describe('PUT /api/orders/:id/status', () => {
    it('should allow seller to update status with valid transition', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testSellerUser);
      mockPrisma.order.findFirst.mockResolvedValue({
        ...sampleOrder,
        status: 'PENDING',
        seller: { ...testSeller, user: { id: testSellerUser.id } },
      });
      mockPrisma.order.update.mockResolvedValue({
        ...sampleOrder,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        seller: { ...testSeller, user: { id: testSellerUser.id } },
      });

      const res = await request(app)
        .put('/api/orders/order-1/status')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('order');
      expect(notificationService.notifyOrderConfirmed).toHaveBeenCalled();
      expect(otpService.sendOrderNotification).toHaveBeenCalled();
    });

    it('should return 400 for invalid status transition', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testSellerUser);
      mockPrisma.order.findFirst.mockResolvedValue({
        ...sampleOrder,
        status: 'PENDING',
        seller: { ...testSeller, user: { id: testSellerUser.id } },
      });

      const res = await request(app)
        .put('/api/orders/order-1/status')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'DELIVERED' }); // Cannot go from PENDING to DELIVERED

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot transition');
    });

    it('should return 404 if order not found for seller', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testSellerUser);
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/orders/nonexistent/status')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });

    it('should return 403 for non-seller user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);

      const res = await request(app)
        .put('/api/orders/order-1/status')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(403);
    });

    it('should restore stock on cancellation', async () => {
      const orderWithItems = {
        ...sampleOrder,
        status: 'CONFIRMED',
        items: [
          { id: 'item-1', productId: 'product-1', quantity: 2, product: sampleProduct },
        ],
        seller: { ...testSeller, user: { id: testSellerUser.id } },
        buyer: testBuyerUser,
      };

      mockPrisma.user.findUnique.mockResolvedValue(testSellerUser);
      mockPrisma.order.findFirst.mockResolvedValue(orderWithItems);
      mockPrisma.product.update.mockResolvedValue(sampleProduct);
      mockPrisma.order.update.mockResolvedValue({
        ...orderWithItems,
        status: 'CANCELLED',
        cancelledAt: new Date(),
      });

      const res = await request(app)
        .put('/api/orders/order-1/status')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(200);
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          data: expect.objectContaining({ inStock: true }),
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // POST /api/orders/:id/pay
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/orders/:id/pay', () => {
    it('should initialize payment for valid order', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);
      mockPrisma.order.findFirst.mockResolvedValue(sampleOrder);
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment-1',
        orderId: sampleOrder.id,
        reference: 'MSN-TEST-REF',
        amount: sampleOrder.totalAmount,
        status: 'PENDING',
      });
      mockPrisma.order.update.mockResolvedValue(sampleOrder);

      const res = await request(app)
        .post('/api/orders/order-1/pay')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('paymentUrl');
      expect(res.body).toHaveProperty('reference');
      expect(res.body).toHaveProperty('provider');
      expect(paymentService.initializePayment).toHaveBeenCalled();
    });

    it('should return 404 for already paid or nonexistent order', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/orders/order-1/pay')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/orders/order-1/pay')
        .send({});

      expect(res.status).toBe(401);
    });
  });
});
