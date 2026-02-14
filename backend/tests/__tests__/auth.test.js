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

// ─── Mock OTP Service ───────────────────────────────────────────
jest.mock('../../src/services/otp', () => ({
  sendOtp: jest.fn().mockResolvedValue({ success: true }),
  formatPhone: jest.fn((phone) => {
    if (phone.startsWith('+234')) return phone;
    if (phone.startsWith('234')) return '+' + phone;
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

// ─── Test Data ──────────────────────────────────────────────────
const testUser = {
  id: 'test-user-id',
  phone: '+2348012345678',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'BUYER',
  accountType: 'INDIVIDUAL',
  isActive: true,
  isVerified: true,
  seller: null,
  state: 'Lagos',
  city: 'Ikeja',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // POST /api/auth/otp/send
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/auth/otp/send', () => {
    it('should return success for a valid Nigerian phone number', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.otpCode.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.otpCode.create.mockResolvedValue({ id: 'otp-1', code: '123456' });

      const res = await request(app)
        .post('/api/auth/otp/send')
        .send({ phone: '+2348012345678' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('OTP sent successfully');
      expect(res.body).toHaveProperty('isNewUser');
    });

    it('should return 400 for an invalid phone format', async () => {
      const res = await request(app)
        .post('/api/auth/otp/send')
        .send({ phone: '12345' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 when phone is missing', async () => {
      const res = await request(app)
        .post('/api/auth/otp/send')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should set isNewUser to false for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockPrisma.otpCode.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.otpCode.create.mockResolvedValue({ id: 'otp-2', code: '123456' });

      const res = await request(app)
        .post('/api/auth/otp/send')
        .send({ phone: '+2348012345678' });

      expect(res.status).toBe(200);
      expect(res.body.isNewUser).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // POST /api/auth/otp/verify
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/auth/otp/verify', () => {
    it('should return token for existing user with valid OTP', async () => {
      const otpRecord = {
        id: 'otp-1',
        phone: '+2348012345678',
        code: '123456',
        used: false,
        expiresAt: new Date(Date.now() + 600000),
      };

      mockPrisma.otpCode.findFirst.mockResolvedValue(otpRecord);
      mockPrisma.otpCode.update.mockResolvedValue({ ...otpRecord, used: true });
      mockPrisma.user.findUnique.mockResolvedValue({ ...testUser, seller: null });

      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: '+2348012345678', code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.isNewUser).toBe(false);
      expect(res.body).toHaveProperty('user');
    });

    it('should return tempToken for new user with valid OTP', async () => {
      const otpRecord = {
        id: 'otp-2',
        phone: '+2348012345678',
        code: '654321',
        used: false,
        expiresAt: new Date(Date.now() + 600000),
      };

      mockPrisma.otpCode.findFirst.mockResolvedValue(otpRecord);
      mockPrisma.otpCode.update.mockResolvedValue({ ...otpRecord, used: true });
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user

      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: '+2348012345678', code: '654321' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('tempToken');
      expect(res.body.isNewUser).toBe(true);
    });

    it('should return 400 for invalid/expired OTP', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: '+2348012345678', code: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid or expired OTP');
    });

    it('should return 400 when phone or code is missing', async () => {
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ phone: '+2348012345678' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // POST /api/auth/register
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/auth/register', () => {
    it('should create user with valid tempToken and data', async () => {
      const tempToken = jwt.sign(
        { phone: '+2348012345678', verified: true },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      const createdUser = {
        id: 'new-user-id',
        phone: '+2348012345678',
        firstName: 'Jane',
        lastName: 'Doe',
        email: null,
        role: 'BUYER',
        accountType: 'INDIVIDUAL',
        isActive: true,
        isVerified: true,
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          tempToken,
          phone: '+2348012345678',
          firstName: 'Jane',
          lastName: 'Doe',
          accountType: 'INDIVIDUAL',
          state: 'Lagos',
          city: 'Ikeja',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should return 400 for expired tempToken', async () => {
      // Create an already-expired token
      const expiredToken = jwt.sign(
        { phone: '+2348012345678', verified: true },
        JWT_SECRET,
        { expiresIn: '0s' }
      );

      // Small delay to ensure token is expired
      await new Promise((resolve) => setTimeout(resolve, 50));

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          tempToken: expiredToken,
          phone: '+2348012345678',
          firstName: 'Jane',
          lastName: 'Doe',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('expired');
    });

    it('should return 400 when required fields are missing', async () => {
      const tempToken = jwt.sign(
        { phone: '+2348012345678', verified: true },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          tempToken,
          phone: '+2348012345678',
          // missing firstName and lastName
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 409 if user already exists', async () => {
      const tempToken = jwt.sign(
        { phone: '+2348012345678', verified: true },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      mockPrisma.user.findUnique.mockResolvedValue(testUser); // User already exists

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          tempToken,
          phone: '+2348012345678',
          firstName: 'Jane',
          lastName: 'Doe',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already registered');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/auth/me
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/auth/me', () => {
    it('should return user for valid JWT', async () => {
      const token = jwt.sign({ userId: testUser.id }, JWT_SECRET);

      // First call by auth middleware, second call by the route handler
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(testUser) // auth middleware
        .mockResolvedValueOnce(testUser); // route handler

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.firstName).toBe('John');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 when user is not found', async () => {
      const token = jwt.sign({ userId: 'nonexistent-id' }, JWT_SECRET);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });
  });
});
