import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '../../context/CartContext';

// Test component that exposes cart context
function CartConsumer() {
  const { cart, addToCart, updateQty, removeItem, clearCart, cartTotal, cartCount } = useCart();
  return (
    <div>
      <span data-testid="cart">{JSON.stringify(cart)}</span>
      <span data-testid="cartTotal">{cartTotal}</span>
      <span data-testid="cartCount">{cartCount}</span>
      <button
        onClick={() =>
          addToCart({ id: 'p1', name: 'Drug A', price: 5000, type: 'PHARMACEUTICAL' })
        }
      >
        Add Drug A
      </button>
      <button
        onClick={() =>
          addToCart({ id: 'p2', name: 'Blood B', price: 20000, type: 'BLOOD_PRODUCT' })
        }
      >
        Add Blood B
      </button>
      <button onClick={() => updateQty('p1', 1)}>Inc Drug A</button>
      <button onClick={() => updateQty('p1', -1)}>Dec Drug A</button>
      <button onClick={() => removeItem('p1')}>Remove Drug A</button>
      <button onClick={() => clearCart()}>Clear Cart</button>
    </div>
  );
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with an empty cart', () => {
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );
    expect(screen.getByTestId('cart').textContent).toBe('[]');
    expect(screen.getByTestId('cartTotal').textContent).toBe('0');
    expect(screen.getByTestId('cartCount').textContent).toBe('0');
  });

  it('addToCart adds an item with qty 1', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText('Add Drug A'));

    const cart = JSON.parse(screen.getByTestId('cart').textContent);
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('p1');
    expect(cart[0].name).toBe('Drug A');
    expect(cart[0].qty).toBe(1);
  });

  it('addToCart increments qty if item already exists', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText('Add Drug A'));
    await user.click(screen.getByText('Add Drug A'));

    const cart = JSON.parse(screen.getByTestId('cart').textContent);
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(2);
  });

  it('addToCart adds different items separately', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText('Add Drug A'));
    await user.click(screen.getByText('Add Blood B'));

    const cart = JSON.parse(screen.getByTestId('cart').textContent);
    expect(cart).toHaveLength(2);
  });

  it('updateQty increases quantity', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText('Add Drug A'));
    await user.click(screen.getByText('Inc Drug A'));

    const cart = JSON.parse(screen.getByTestId('cart').textContent);
    expect(cart[0].qty).toBe(2);
  });

  it('updateQty decreases quantity', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Add twice so qty = 2
    await user.click(screen.getByText('Add Drug A'));
    await user.click(screen.getByText('Add Drug A'));
    expect(JSON.parse(screen.getByTestId('cart').textContent)[0].qty).toBe(2);

    await user.click(screen.getByText('Dec Drug A'));
    expect(JSON.parse(screen.getByTestId('cart').textContent)[0].qty).toBe(1);
  });

  it('updateQty removes item when qty goes to 0', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText('Add Drug A'));
    expect(JSON.parse(screen.getByTestId('cart').textContent)).toHaveLength(1);

    await user.click(screen.getByText('Dec Drug A'));
    expect(JSON.parse(screen.getByTestId('cart').textContent)).toHaveLength(0);
  });

  it('removeItem removes item from cart', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText('Add Drug A'));
    await user.click(screen.getByText('Add Blood B'));
    expect(JSON.parse(screen.getByTestId('cart').textContent)).toHaveLength(2);

    await user.click(screen.getByText('Remove Drug A'));
    const cart = JSON.parse(screen.getByTestId('cart').textContent);
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe('p2');
  });

  it('clearCart empties the cart', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText('Add Drug A'));
    await user.click(screen.getByText('Add Blood B'));
    expect(JSON.parse(screen.getByTestId('cart').textContent)).toHaveLength(2);

    await user.click(screen.getByText('Clear Cart'));
    expect(JSON.parse(screen.getByTestId('cart').textContent)).toHaveLength(0);
    expect(screen.getByTestId('cartTotal').textContent).toBe('0');
    expect(screen.getByTestId('cartCount').textContent).toBe('0');
  });

  it('cartTotal calculates correctly', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Drug A: 5000 x 1 = 5000
    await user.click(screen.getByText('Add Drug A'));
    expect(screen.getByTestId('cartTotal').textContent).toBe('5000');

    // Drug A: 5000 x 2 = 10000
    await user.click(screen.getByText('Add Drug A'));
    expect(screen.getByTestId('cartTotal').textContent).toBe('10000');

    // Drug A: 5000 x 2 + Blood B: 20000 x 1 = 30000
    await user.click(screen.getByText('Add Blood B'));
    expect(screen.getByTestId('cartTotal').textContent).toBe('30000');
  });

  it('cartCount returns total item quantity', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText('Add Drug A'));
    expect(screen.getByTestId('cartCount').textContent).toBe('1');

    await user.click(screen.getByText('Add Drug A'));
    expect(screen.getByTestId('cartCount').textContent).toBe('2');

    await user.click(screen.getByText('Add Blood B'));
    expect(screen.getByTestId('cartCount').textContent).toBe('3');
  });

  it('persists cart to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText('Add Drug A'));

    const stored = JSON.parse(localStorage.getItem('medsource_cart'));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('p1');
  });

  it('loads cart from localStorage on mount', () => {
    const cartItems = [
      { id: 'p1', name: 'Drug A', price: 5000, type: 'PHARMACEUTICAL', qty: 3 },
    ];
    localStorage.setItem('medsource_cart', JSON.stringify(cartItems));

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    const cart = JSON.parse(screen.getByTestId('cart').textContent);
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);
    expect(screen.getByTestId('cartTotal').textContent).toBe('15000');
    expect(screen.getByTestId('cartCount').textContent).toBe('3');
  });
});
