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

// ─── Mock Search Service ────────────────────────────────────────
const mockSearchService = {
  searchProducts: jest.fn(),
  getSuggestions: jest.fn(),
  getTrending: jest.fn(),
};
jest.mock('../../src/services/search', () => mockSearchService);

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
const testSeller = {
  id: 'seller-1',
  businessName: 'Lagos Pharma Ltd',
  isVerified: true,
  state: 'Lagos',
  city: 'Ikeja',
  userId: 'seller-user-id',
};

const testSellerUser = {
  id: 'seller-user-id',
  phone: '+2348099999999',
  firstName: 'Seller',
  lastName: 'User',
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
  role: 'BUYER',
  isActive: true,
  isVerified: true,
  seller: null,
};

const sampleProduct = {
  id: 'product-1',
  name: 'Rituximab 500mg',
  type: 'PHARMACEUTICAL',
  description: 'Monoclonal antibody for cancer treatment',
  price: 250000,
  quantity: 10,
  inStock: true,
  isActive: true,
  category: 'Oncology',
  sellerId: testSeller.id,
  seller: { businessName: 'Lagos Pharma Ltd', isVerified: true },
  images: [],
  viewCount: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sellerToken = jwt.sign({ userId: testSellerUser.id }, JWT_SECRET);
const buyerToken = jwt.sign({ userId: testBuyerUser.id }, JWT_SECRET);

describe('Product Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/products
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/products', () => {
    it('should return product list from search service', async () => {
      const searchResult = {
        products: [sampleProduct],
        pagination: { total: 1, page: 1, limit: 20, pages: 1, hasMore: false },
      };
      mockSearchService.searchProducts.mockResolvedValue(searchResult);

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('products');
      expect(res.body.products).toHaveLength(1);
      expect(res.body).toHaveProperty('pagination');
      expect(mockSearchService.searchProducts).toHaveBeenCalled();
    });

    it('should pass query parameters to search service', async () => {
      mockSearchService.searchProducts.mockResolvedValue({
        products: [],
        pagination: { total: 0, page: 1, limit: 20, pages: 0, hasMore: false },
      });

      await request(app).get('/api/products?q=rituximab&type=pharmaceutical&state=Lagos');

      expect(mockSearchService.searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'rituximab',
          type: 'PHARMACEUTICAL',
          state: 'Lagos',
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/products/categories
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/products/categories', () => {
    it('should return categories with counts', async () => {
      const categoriesResult = [
        { category: 'Oncology', _count: { id: 15 } },
        { category: 'Antibiotics', _count: { id: 8 } },
      ];
      const bloodTypesResult = [
        { bloodType: 'O_NEGATIVE', _count: { id: 5 } },
      ];

      mockPrisma.product.groupBy
        .mockResolvedValueOnce(categoriesResult)
        .mockResolvedValueOnce(bloodTypesResult);

      const res = await request(app).get('/api/products/categories');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('categories');
      expect(res.body).toHaveProperty('bloodTypes');
      expect(res.body.categories).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET /api/products/:id
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/products/:id', () => {
    it('should return product detail for valid ID', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(sampleProduct);
      mockPrisma.product.update.mockResolvedValue(sampleProduct); // view count increment
      mockPrisma.product.findMany.mockResolvedValue([]); // related products

      const res = await request(app).get('/api/products/product-1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('product');
      expect(res.body.product.name).toBe('Rituximab 500mg');
      expect(res.body).toHaveProperty('related');
    });

    it('should return 404 for nonexistent product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/products/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Product not found');
    });

    it('should return 404 for inactive product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...sampleProduct,
        isActive: false,
      });

      const res = await request(app).get('/api/products/product-1');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Product not found');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // POST /api/products
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/products', () => {
    it('should create product with seller JWT', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testSellerUser);
      mockPrisma.product.create.mockResolvedValue(sampleProduct);

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'Rituximab 500mg',
          type: 'PHARMACEUTICAL',
          price: 250000,
          quantity: 10,
          description: 'Monoclonal antibody for cancer treatment',
          category: 'Oncology',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('product');
      expect(mockPrisma.product.create).toHaveBeenCalled();
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: 'Rituximab 500mg',
          type: 'PHARMACEUTICAL',
          price: 250000,
          quantity: 10,
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-seller user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testBuyerUser);

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'Rituximab 500mg',
          type: 'PHARMACEUTICAL',
          price: 250000,
          quantity: 10,
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 for missing required fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testSellerUser);

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'Rituximab',
          // missing type, price, quantity
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PUT /api/products/:id
  // ═══════════════════════════════════════════════════════════════
  describe('PUT /api/products/:id', () => {
    it('should update product for owner seller', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testSellerUser);
      mockPrisma.product.findFirst.mockResolvedValue(sampleProduct);
      mockPrisma.product.update.mockResolvedValue({
        ...sampleProduct,
        price: 275000,
      });

      const res = await request(app)
        .put('/api/products/product-1')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ price: 275000 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('product');
      expect(mockPrisma.product.update).toHaveBeenCalled();
    });

    it('should return 404 if product not owned by seller', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testSellerUser);
      mockPrisma.product.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/products/product-1')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ price: 275000 });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put('/api/products/product-1')
        .send({ price: 275000 });

      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DELETE /api/products/:id
  // ═══════════════════════════════════════════════════════════════
  describe('DELETE /api/products/:id', () => {
    it('should soft delete product for owner seller', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testSellerUser);
      mockPrisma.product.findFirst.mockResolvedValue(sampleProduct);
      mockPrisma.product.update.mockResolvedValue({ ...sampleProduct, isActive: false });

      const res = await request(app)
        .delete('/api/products/product-1')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Product removed');
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { isActive: false },
      });
    });

    it('should return 404 if product not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testSellerUser);
      mockPrisma.product.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/products/product-999')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Product not found');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).delete('/api/products/product-1');

      expect(res.status).toBe(401);
    });
  });
});
