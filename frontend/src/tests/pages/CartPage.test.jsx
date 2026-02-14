import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '../test-utils';
import CartPage from '../../pages/CartPage';
import { CartProvider } from '../../context/CartContext';
import { ToastProvider } from '../../context/ToastContext';
import { AuthProvider } from '../../context/AuthContext';

describe('CartPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows empty cart message when cart is empty', () => {
    render(<CartPage />);
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('shows "Browse Products" button when cart is empty', () => {
    render(<CartPage />);
    expect(screen.getByText('Browse Products')).toBeInTheDocument();
  });

  it('shows "Shopping Cart" heading when cart is empty', () => {
    render(<CartPage />);
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
  });

  it('shows cart items when cart has products', () => {
    // Pre-populate localStorage with cart data
    const cartItems = [
      { id: '1', name: 'Imatinib 400mg', type: 'PHARMACEUTICAL', price: 75000, qty: 2 },
      { id: '2', name: 'Packed Red Cells O+', type: 'BLOOD_PRODUCT', price: 25000, qty: 1, bloodType: 'O+' },
    ];
    localStorage.setItem('medsource_cart', JSON.stringify(cartItems));

    rtlRender(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <CartPage />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Imatinib 400mg')).toBeInTheDocument();
    expect(screen.getByText('Packed Red Cells O+')).toBeInTheDocument();
  });

  it('shows cart count in heading when cart has items', () => {
    const cartItems = [
      { id: '1', name: 'Drug A', type: 'PHARMACEUTICAL', price: 10000, qty: 3 },
    ];
    localStorage.setItem('medsource_cart', JSON.stringify(cartItems));

    rtlRender(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <CartPage />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // cartCount = 3, so heading is "Shopping Cart (3)"
    expect(screen.getByText('Shopping Cart (3)')).toBeInTheDocument();
  });

  it('shows Proceed to Checkout button when cart has items', () => {
    const cartItems = [
      { id: '1', name: 'Drug A', type: 'PHARMACEUTICAL', price: 5000, qty: 1 },
    ];
    localStorage.setItem('medsource_cart', JSON.stringify(cartItems));

    rtlRender(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <CartPage />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument();
  });

  it('shows blood type tag for blood products in cart', () => {
    const cartItems = [
      { id: '1', name: 'Whole Blood', type: 'BLOOD_PRODUCT', price: 20000, qty: 1, bloodType: 'AB+' },
    ];
    localStorage.setItem('medsource_cart', JSON.stringify(cartItems));

    rtlRender(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <CartPage />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('AB+')).toBeInTheDocument();
  });
});
