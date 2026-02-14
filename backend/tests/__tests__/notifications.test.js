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
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
};

jest.mock('../../src/models', () => mockPrisma);

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

// ─── Mock OTP Service (needed by auth routes loaded with server) ─
jest.mock('../../src/services/otp', () => ({
  sendOtp: jest.fn().mockResolvedValue({ success: true }),
  formatPhone: jest.fn((phone) => phone),
  generateCode: jest.fn().mockReturnValue('123456'),
  sendOrderNotification: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const app = require('../../src/server');

// ─── Test Data ──────────────────────────────────────────────────
const testUser = {
  id: 'test-user-id',
  phone: '+2348012345678',
  firstName: 'John',
  lastName: 'Doe',
  role: 'BUYER',
  isActive: true,
  isVerified: true,
  seller: null,
};

const sampleNotifications = [
  {
    id: 'notif-1',
    userId: testUser.id,
    type: 'ORDER_PLACED',
    title: 'Order Placed',
    body: 'Your order MSN-20260214-ABCD has been placed.',
    isRead: false,
    data: {},
    createdAt: new Date(),
  },
  {
    id: 'notif-2',
    userId: testUser.id,
    type: 'ORDER_CONFIRMED',
    title: 'Order Confirmed',
    body: 'Your order MSN-20260214-ABCD has been confirmed.',
    isRead: true,
    data: {},
    createdAt: new Date(),
  },
];

const token = jwt.sign({ userId: testUser.id }, JWT_SECRET);

describe('Notification Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/notifications
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/notifications', () => {
    it('should return notifications list for authenticated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockPrisma.notification.findMany.mockResolvedValue(sampleNotifications);
      mockPrisma.notification.count
        .mockResolvedValueOnce(2)  // total count
        .mockResolvedValueOnce(1); // unread count

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(res.body.notifications).toHaveLength(2);
      expect(res.body).toHaveProperty('unreadCount');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/notifications/unread-count
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/notifications/unread-count', () => {
    it('should return unread count', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockPrisma.notification.count.mockResolvedValue(5);

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count', 5);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/notifications/unread-count');
      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PUT /api/notifications/:id/read
  // ═══════════════════════════════════════════════════════════════
  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .put('/api/notifications/notif-1/read')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: testUser.id },
        data: { isRead: true },
      });
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).put('/api/notifications/notif-1/read');
      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PUT /api/notifications/read-all
  // ═══════════════════════════════════════════════════════════════
  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: testUser.id, isRead: false },
        data: { isRead: true },
      });
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).put('/api/notifications/read-all');
      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DELETE /api/notifications/:id
  // ═══════════════════════════════════════════════════════════════
  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .delete('/api/notifications/notif-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: testUser.id },
      });
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).delete('/api/notifications/notif-1');
      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Auth required for all routes
  // ═══════════════════════════════════════════════════════════════
  describe('All routes require authentication', () => {
    const unauthenticatedTests = [
      { method: 'get', path: '/api/notifications' },
      { method: 'get', path: '/api/notifications/unread-count' },
      { method: 'put', path: '/api/notifications/notif-1/read' },
      { method: 'put', path: '/api/notifications/read-all' },
      { method: 'delete', path: '/api/notifications/notif-1' },
    ];

    unauthenticatedTests.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} should return 401 without token`, async () => {
        const res = await request(app)[method](path);
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
      });
    });
  });
});
