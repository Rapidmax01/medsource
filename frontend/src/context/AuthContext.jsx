import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import { requestNotificationPermission } from '../services/firebase';

const AuthContext = createContext(null);

const TOKEN_KEY = 'medsource_token';
const USER_KEY = 'medsource_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch fresh user data on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.getMe()
      .then((res) => {
        const userData = res.user || res;
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      })
      .catch(() => {
        // Token invalid - clear auth
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);

    // Request push notifications after login
    requestNotificationPermission().catch(() => {});
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SUB_ADMIN';
  const isSeller = user?.role === 'SELLER' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isSeller, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
