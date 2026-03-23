import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductDetailPage } from './ProductDetailPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCartThunk } from '../store/slices/cartSlice';
import { useCartAutoTotals } from '../hooks/useCartAutoTotals';

jest.mock('../store/slices/cartSlice', () => ({
  ...jest.requireActual('../store/slices/cartSlice'),
  addToCartThunk: jest.fn(),
}));

jest.mock('../store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock('../hooks/useCartAutoTotals');
jest.mock('../hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => require('../utils/money').formatMoney,
}));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockDispatch = jest.fn().mockResolvedValue(undefined);

const product = {
  id: 'p1',
  name: 'Fancy Gadget',
  price: 299,
  images: ['img.jpg'],
  category: 'Electronics' as const,
  stock: 10,
  rating: 4.5,
  ratingCount: 20,
  description: 'A fancy gadget',
  specs: { Brand: 'Acme' },
  reviews: [{ id: 'r1', userName: 'Alice', rating: 5, title: 'Great!', body: 'Love it.', createdAt: '2024-01-01T00:00:00Z' }],
};

const makeState = (overrides: any = {}) => {
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      products: { products: [product], isLoading: false, error: null, ...overrides },
      cart: { items: [] },
    })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockResolvedValue(undefined);
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
  (addToCartThunk as jest.Mock).mockReturnValue({ _thunk: 'addToCart' });
  makeState();
});

const wrap = (productId = 'p1') =>
  render(
    <MemoryRouter initialEntries={[`/products/${productId}`]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('ProductDetailPage', () => {
  it('shows LoadingSpinner when isLoading and no products', () => {
    makeState({ isLoading: true, products: [] });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows EmptyState "Product not found" when product not in list', () => {
    makeState({ products: [] });
    wrap('unknown');
    expect(screen.getByText('Product not found')).toBeInTheDocument();
  });

  it('"Back to products" action navigates to /products', () => {
    makeState({ products: [] });
    wrap('unknown');
    fireEvent.click(screen.getByRole('button', { name: /back to products/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('shows product name when found', () => {
    wrap();
    expect(screen.getByText('Fancy Gadget')).toBeInTheDocument();
  });

  it('shows formatted price', () => {
    wrap();
    expect(screen.getByText('$299.00')).toBeInTheDocument();
  });

  it('shows product description', () => {
    wrap();
    expect(screen.getByText('A fancy gadget')).toBeInTheDocument();
  });

  it('Add to cart button dispatches addToCartThunk with clamped qty', () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(addToCartThunk).toHaveBeenCalledWith({ productId: 'p1', qty: 1 });
    expect(mockDispatch).toHaveBeenCalledWith({ _thunk: 'addToCart' });
  });

  it('shows review when product has reviews', () => {
    wrap();
    expect(screen.getByText('Great!')).toBeInTheDocument();
    expect(screen.getByText('Love it.')).toBeInTheDocument();
  });
});
