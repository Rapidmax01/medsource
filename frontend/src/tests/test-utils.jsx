import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';

function AllProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function customRender(ui, options) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Render with MemoryRouter for testing specific routes.
 * Pass initialEntries via options to set the starting URL.
 */
function renderWithMemoryRouter(ui, { initialEntries = ['/'], ...options } = {}) {
  function MemoryProviders({ children }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: MemoryProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render, renderWithMemoryRouter };
