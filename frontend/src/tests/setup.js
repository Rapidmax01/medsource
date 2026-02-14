import '@testing-library/jest-dom';

// Mock the API service to prevent real HTTP calls
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  authApi: {
    sendOtp: vi.fn(),
    verifyOtp: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn().mockRejectedValue(new Error('Not authenticated')),
    updateProfile: vi.fn(),
    updateFcmToken: vi.fn(),
  },
  productApi: {
    search: vi.fn().mockResolvedValue({ products: [], total: 0 }),
    getById: vi.fn(),
    getSuggestions: vi.fn(),
    getTrending: vi.fn(),
    getCategories: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  orderApi: {
    create: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
    initializePayment: vi.fn(),
  },
  inquiryApi: {
    create: vi.fn(),
    getAll: vi.fn(),
    getSellerInquiries: vi.fn(),
    respond: vi.fn(),
    close: vi.fn(),
  },
  sellerApi: {
    register: vi.fn(),
    getDashboard: vi.fn(),
    getProducts: vi.fn(),
    getOrders: vi.fn(),
    updateProfile: vi.fn(),
    getPublicProfile: vi.fn(),
  },
  paymentApi: {
    verify: vi.fn(),
  },
  notificationApi: {
    getAll: vi.fn(),
    getUnreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    delete: vi.fn(),
  },
  nafdacApi: {
    verify: vi.fn(),
    verifyBulk: vi.fn(),
    validateFormat: vi.fn(),
  },
}));

// Mock Firebase to prevent initialization
vi.mock('../services/firebase', () => ({
  requestNotificationPermission: vi.fn().mockResolvedValue(null),
  onForegroundMessage: vi.fn().mockReturnValue(() => {}),
  registerServiceWorker: vi.fn().mockResolvedValue(null),
  messaging: null,
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver;

// Mock matchMedia
window.matchMedia = window.matchMedia || function () {
  return { matches: false, addListener() {}, removeListener() {} };
};

// Clean up localStorage between tests
afterEach(() => {
  localStorage.clear();
});
