// Set env before anything
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRY = '30d';

// Mock Prisma
jest.mock('../../src/models', () => ({
  user: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), delete: jest.fn(), deleteMany: jest.fn(), count: jest.fn(), groupBy: jest.fn(), aggregate: jest.fn() },
  $disconnect: jest.fn(),
}));

// Mock rate limiter
jest.mock('../../src/middleware/rateLimit', () => ({
  apiLimiter: (req, res, next) => next(),
  otpLimiter: (req, res, next) => next(),
  webhookLimiter: (req, res, next) => next(),
}));

// Mock firebase-admin to prevent initialization errors
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  messaging: jest.fn(() => ({ send: jest.fn(), sendEachForMulticast: jest.fn() })),
}));

const request = require('supertest');
const app = require('../../src/server');

describe('Health Endpoint', () => {
  it('GET /api/health should return 200 with correct JSON', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      service: 'MedSource API',
      version: '1.0.0',
    });
  });

  it('GET /api/nonexistent should return 404', async () => {
    const res = await request(app).get('/api/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Route not found');
  });
});
