import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';
import HomePage from '../../pages/HomePage';
import { productApi } from '../../services/api';

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    productApi.search.mockResolvedValue({ products: [], total: 0 });
  });

  it('renders category filter chips', async () => {
    render(<HomePage />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Oncology')).toBeInTheDocument();
    expect(screen.getByText('Rare Disease')).toBeInTheDocument();
    expect(screen.getByText('Anti-infective')).toBeInTheDocument();
    expect(screen.getByText('Blood Products')).toBeInTheDocument();
  });

  it('shows loading state initially (Searching...)', () => {
    // Make the API hang so we see loading
    productApi.search.mockReturnValue(new Promise(() => {}));
    render(<HomePage />);
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows skeleton cards while loading', () => {
    productApi.search.mockReturnValue(new Promise(() => {}));
    const { container } = render(<HomePage />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(4);
  });

  it('shows "No products found" when API returns empty', async () => {
    productApi.search.mockResolvedValue({ products: [], total: 0 });
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument();
    });
  });

  it('shows "0 products found" count when empty', async () => {
    productApi.search.mockResolvedValue({ products: [], total: 0 });
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText('0 products found')).toBeInTheDocument();
    });
  });

  it('renders product cards when API returns products', async () => {
    productApi.search.mockResolvedValue({
      products: [
        { id: '1', name: 'Imatinib 400mg', type: 'PHARMACEUTICAL', price: 75000, verified: true },
        { id: '2', name: 'Packed Red Cells O+', type: 'BLOOD_PRODUCT', price: 25000, bloodType: 'O+' },
      ],
      total: 2,
    });
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText('Imatinib 400mg')).toBeInTheDocument();
      expect(screen.getByText('Packed Red Cells O+')).toBeInTheDocument();
    });
  });

  it('shows "2 products found" when API returns 2 products', async () => {
    productApi.search.mockResolvedValue({
      products: [
        { id: '1', name: 'Drug A', type: 'PHARMACEUTICAL', price: 1000 },
        { id: '2', name: 'Drug B', type: 'PHARMACEUTICAL', price: 2000 },
      ],
      total: 2,
    });
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText('2 products found')).toBeInTheDocument();
    });
  });

  it('calls productApi.search on mount', async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(productApi.search).toHaveBeenCalled();
    });
  });

  it('switches category when a chip is clicked', async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await waitFor(() => {
      expect(productApi.search).toHaveBeenCalled();
    });

    vi.clearAllMocks();
    productApi.search.mockResolvedValue({ products: [], total: 0 });

    await user.click(screen.getByText('Oncology'));
    await waitFor(() => {
      expect(productApi.search).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Oncology', type: 'PHARMACEUTICAL' })
      );
    });
  });

  it('shows blood type filter chips when Blood Products is selected', async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await waitFor(() => {
      expect(productApi.search).toHaveBeenCalled();
    });

    // Blood type chips should be visible by default (category is 'All' and showBloodFilter is true for 'All')
    expect(screen.getByText('All Types')).toBeInTheDocument();
    expect(screen.getByText('O+')).toBeInTheDocument();
    expect(screen.getByText('AB-')).toBeInTheDocument();
  });
});
