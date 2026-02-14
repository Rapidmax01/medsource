import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithMemoryRouter } from '../test-utils';
import Layout from '../../components/shared/Layout';

describe('Layout', () => {
  it('renders the MedSource logo text in the header', () => {
    renderWithMemoryRouter(<Layout />);
    expect(screen.getByText('MedSource')).toBeInTheDocument();
  });

  it('renders the search bar with placeholder', () => {
    renderWithMemoryRouter(<Layout />);
    expect(
      screen.getByPlaceholderText('Search medications, blood products...')
    ).toBeInTheDocument();
  });

  it('renders bottom navigation with Home link', () => {
    renderWithMemoryRouter(<Layout />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders bottom navigation with Cart link', () => {
    renderWithMemoryRouter(<Layout />);
    expect(screen.getByText('Cart')).toBeInTheDocument();
  });

  it('renders bottom navigation with Orders link', () => {
    renderWithMemoryRouter(<Layout />);
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  it('renders bottom navigation with Account link', () => {
    renderWithMemoryRouter(<Layout />);
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders all four navigation links', () => {
    renderWithMemoryRouter(<Layout />);
    const links = screen.getAllByRole('link');
    // Home, Cart, Orders, Account = 4 nav links
    expect(links.length).toBeGreaterThanOrEqual(4);
  });

  it('Home link points to /', () => {
    renderWithMemoryRouter(<Layout />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('Cart link points to /cart', () => {
    renderWithMemoryRouter(<Layout />);
    const cartLink = screen.getByText('Cart').closest('a');
    expect(cartLink).toHaveAttribute('href', '/cart');
  });

  it('Orders link points to /orders', () => {
    renderWithMemoryRouter(<Layout />);
    const ordersLink = screen.getByText('Orders').closest('a');
    expect(ordersLink).toHaveAttribute('href', '/orders');
  });

  it('Account link points to /profile', () => {
    renderWithMemoryRouter(<Layout />);
    const accountLink = screen.getByText('Account').closest('a');
    expect(accountLink).toHaveAttribute('href', '/profile');
  });
});
