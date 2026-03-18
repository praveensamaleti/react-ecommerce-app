import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { useProductsStore } from '../stores/productsStore';
import { useCartStore } from '../stores/cartStore';
import { useCartAutoTotals } from '../hooks/useCartAutoTotals';

jest.mock('../stores/productsStore');
jest.mock('../stores/cartStore');
jest.mock('../hooks/useCartAutoTotals');
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockLoadProducts = jest.fn();
const mockAddToCart = jest.fn();

const featuredProduct = {
  id: 'p1',
  name: 'Featured Widget',
  price: 99,
  images: ['img.jpg'],
  category: 'Electronics' as const,
  stock: 5,
  rating: 4,
  ratingCount: 10,
  description: 'desc',
  specs: {},
  reviews: [],
  featured: true,
};

const makeProductsState = (overrides: any = {}) => {
  (useProductsStore as jest.Mock).mockImplementation((selector: any) => {
    const state = {
      products: [],
      isLoading: false,
      error: null,
      loadProducts: mockLoadProducts,
      ...overrides,
    };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

const makeCartState = () => {
  (useCartStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { addToCart: mockAddToCart };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
  makeProductsState();
  makeCartState();
});

const wrap = () => render(<MemoryRouter><HomePage /></MemoryRouter>);

describe('HomePage', () => {
  it('calls loadProducts on mount when products is empty', () => {
    wrap();
    expect(mockLoadProducts).toHaveBeenCalledTimes(1);
  });

  it('does not call loadProducts when products already loaded', () => {
    makeProductsState({ products: [featuredProduct] });
    wrap();
    expect(mockLoadProducts).not.toHaveBeenCalled();
  });

  it('shows LoadingSpinner when isLoading=true', () => {
    makeProductsState({ isLoading: true });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error alert when error is set', () => {
    makeProductsState({ error: 'Failed to load' });
    wrap();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders featured products', () => {
    makeProductsState({ products: [featuredProduct] });
    wrap();
    expect(screen.getByText('Featured Widget')).toBeInTheDocument();
  });

  it('clicking Add to cart calls addToCart', () => {
    makeProductsState({ products: [featuredProduct] });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /add featured widget to cart/i }));
    expect(mockAddToCart).toHaveBeenCalledWith('p1', 1);
  });

  it('quick view button opens QuickViewModal', () => {
    makeProductsState({ products: [featuredProduct] });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /quick view featured widget/i }));
    // Modal opens with the product name in it
    expect(screen.getAllByText('Featured Widget').length).toBeGreaterThan(0);
  });
});
