import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/shared/Layout';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import VerifyPage from './pages/VerifyPage';
import RegisterPage from './pages/RegisterPage';
import EmailRegisterPage from './pages/EmailRegisterPage';
import EmailVerifyPage from './pages/EmailVerifyPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import SellerOnboardingPage from './pages/SellerOnboardingPage';
import AdminPage from './pages/AdminPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Auth routes - no bottom nav */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/verify" element={<GuestRoute><VerifyPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/register/email" element={<GuestRoute><EmailRegisterPage /></GuestRoute>} />
      <Route path="/verify/email" element={<GuestRoute><EmailVerifyPage /></GuestRoute>} />

      {/* Main app routes with bottom nav */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallbackPage /></ProtectedRoute>} />
      </Route>

      {/* Seller routes */}
      <Route path="/seller" element={<ProtectedRoute><SellerDashboardPage /></ProtectedRoute>} />
      <Route path="/seller/onboarding" element={<ProtectedRoute><SellerOnboardingPage /></ProtectedRoute>} />
      <Route path="/seller/register" element={<ProtectedRoute><SellerOnboardingPage /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
