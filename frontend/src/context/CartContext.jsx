import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

const CART_KEY = 'medsource_cart';

function loadCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let next;
      if (existing) {
        next = prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        next = [...prev, { ...product, qty: 1 }];
      }
      saveCart(next);
      return next;
    });
  }, []);

  const updateQty = useCallback((id, delta) => {
    setCart((prev) => {
      const next = prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0);
      saveCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    saveCart([]);
  }, []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeItem, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
