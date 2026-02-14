import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medsource_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medsource_token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { error: 'Network error' });
  }
);

// ============================================================
// AUTH
// ============================================================
export const authApi = {
  sendOtp: (phone) => api.post('/auth/otp/send', { phone }),
  verifyOtp: (phone, code) => api.post('/auth/otp/verify', { phone, code }),
  register: (data) => api.post('/auth/register', data),
  emailLogin: (email, password) => api.post('/auth/email/login', { email, password }),
  emailRegister: (data) => api.post('/auth/email/register', data),
  emailVerify: (tempToken, code) => api.post('/auth/email/verify', { tempToken, code }),
  emailResend: (tempToken) => api.post('/auth/email/resend', { tempToken }),
  googleLogin: (accessToken) => api.post('/auth/google', { accessToken }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updateFcmToken: (fcmToken) => api.put('/auth/fcm-token', { fcmToken }),
};

// ============================================================
// PRODUCTS
// ============================================================
export const productApi = {
  search: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getSuggestions: (q) => api.get('/products/suggestions', { params: { q } }),
  getTrending: () => api.get('/products/trending'),
  getCategories: () => api.get('/products/categories'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ============================================================
// ORDERS
// ============================================================
export const orderApi = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  initializePayment: (id, provider) => api.post(`/orders/${id}/pay`, { provider }),
};

// ============================================================
// INQUIRIES
// ============================================================
export const inquiryApi = {
  create: (data) => api.post('/inquiries', data),
  getAll: (params) => api.get('/inquiries', { params }),
  getSellerInquiries: (params) => api.get('/inquiries/seller', { params }),
  respond: (id, response) => api.put(`/inquiries/${id}/respond`, { response }),
  close: (id) => api.put(`/inquiries/${id}/close`),
};

// ============================================================
// SELLERS
// ============================================================
export const sellerApi = {
  register: (data) => api.post('/sellers/register', data),
  getDashboard: () => api.get('/sellers/dashboard'),
  getProducts: (params) => api.get('/sellers/products', { params }),
  getOrders: (params) => api.get('/sellers/orders', { params }),
  updateProfile: (data) => api.put('/sellers/profile', data),
  getPublicProfile: (id) => api.get(`/sellers/${id}/public`),
};

// ============================================================
// PAYMENTS
// ============================================================
export const paymentApi = {
  verify: (reference, transactionId) =>
    api.get(`/payments/verify/${reference}`, { params: { transaction_id: transactionId } }),
};

// ============================================================
// NOTIFICATIONS
// ============================================================
export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ============================================================
// NAFDAC
// ============================================================
export const nafdacApi = {
  verify: (number) => api.get(`/nafdac/verify/${number}`),
  verifyBulk: (numbers) => api.post('/nafdac/verify-bulk', { numbers }),
  validateFormat: (number) => api.get(`/nafdac/validate-format/${number}`),
};

// ============================================================
// ADMIN
// ============================================================
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
  createSubAdmin: (data) => api.post('/admin/sub-admins', data),
  getSubAdmins: () => api.get('/admin/sub-admins'),
  deleteSubAdmin: (id) => api.delete(`/admin/sub-admins/${id}`),
  getPendingSellers: () => api.get('/admin/sellers/pending'),
  verifySeller: (id) => api.put(`/admin/sellers/${id}/verify`),
  rejectSeller: (id) => api.put(`/admin/sellers/${id}/reject`),
};

// ============================================================
// UPLOAD (Cloudinary)
// ============================================================
export const uploadApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (publicId) => api.delete(`/upload/${publicId}`),
};

export default api;
