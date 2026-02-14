// Create mock Prisma models
const modelNames = [
  'user', 'seller', 'product', 'order', 'orderItem',
  'payment', 'otpCode', 'inquiry', 'notification', 'review',
];

const modelMethods = [
  'findUnique', 'findFirst', 'findMany', 'create', 'update',
  'updateMany', 'delete', 'deleteMany', 'count', 'groupBy', 'aggregate',
];

const mockPrisma = {};

for (const model of modelNames) {
  mockPrisma[model] = {};
  for (const method of modelMethods) {
    mockPrisma[model][method] = jest.fn();
  }
}

// Mock $transaction
mockPrisma.$transaction = jest.fn((fn) => {
  if (typeof fn === 'function') {
    return fn(mockPrisma);
  }
  return Promise.resolve(fn);
});

// Mock $disconnect
mockPrisma.$disconnect = jest.fn();

// Mock the Prisma client module
jest.mock('../src/models', () => mockPrisma);

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

module.exports = { mockPrisma };
