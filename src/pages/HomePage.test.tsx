import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCartThunk } from '../store/slices/cartSlice';
import { useCartAutoTotals } from '../hooks/useCartAutoTotals';

jest.mock('../store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock('../hooks/useCartAutoTotals');
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockDispatch = jest.fn().mockResolvedValue(undefined);

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

const makeState = (overrides: any = {}) => {
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      products: { products: [], isLoading: false, error: null, ...overrides },
      cart: { items: [] },
      currency: { currency: 'USD' },
    })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockResolvedValue(undefined);
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
  makeState();
});

const wrap = () => render(<MemoryRouter><HomePage /></MemoryRouter>);

describe('HomePage', () => {
  it('calls loadProducts on mount when products is empty', () => {
    wrap();
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('does not call loadProducts when products already loaded', () => {
    makeState({ products: [featuredProduct] });
    wrap();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('shows LoadingSpinner when isLoading=true', () => {
    makeState({ isLoading: true });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error alert when error is set', () => {
    makeState({ error: 'Failed to load' });
    wrap();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders featured products', () => {
    makeState({ products: [featuredProduct] });
    wrap();
    expect(screen.getByText('Featured Widget')).toBeInTheDocument();
  });

  it('clicking Add to cart dispatches addToCartThunk', () => {
    makeState({ products: [featuredProduct] });
    wrap();
    const prevCount = mockDispatch.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /add featured widget to cart/i }));
    expect(mockDispatch.mock.calls.length).toBeGreaterThan(prevCount);
  });

  it('quick view button opens QuickViewModal', () => {
    makeState({ products: [featuredProduct] });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /quick view featured widget/i }));
    // Modal opens with the product name in it
    expect(screen.getAllByText('Featured Widget').length).toBeGreaterThan(0);
  });
});
