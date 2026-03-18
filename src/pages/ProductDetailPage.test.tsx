import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductDetailPage } from './ProductDetailPage';
import { useProductsStore } from '../stores/productsStore';
import { useCartStore } from '../stores/cartStore';
import { useCartAutoTotals } from '../hooks/useCartAutoTotals';

jest.mock('../stores/productsStore');
jest.mock('../stores/cartStore');
jest.mock('../hooks/useCartAutoTotals');
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockLoadProducts = jest.fn();
const mockAddToCart = jest.fn();

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

const makeProductsState = (overrides: any = {}) => {
  (useProductsStore as jest.Mock).mockImplementation((selector: any) => {
    const state = {
      products: [product],
      isLoading: false,
      error: null,
      loadProducts: mockLoadProducts,
      ...overrides,
    };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
  makeProductsState();
  (useCartStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { addToCart: mockAddToCart };
    return typeof selector === 'function' ? selector(state) : state;
  });
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
    makeProductsState({ isLoading: true, products: [] });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows EmptyState "Product not found" when product not in list', () => {
    makeProductsState({ products: [] });
    wrap('unknown');
    expect(screen.getByText('Product not found')).toBeInTheDocument();
  });

  it('"Back to products" action navigates to /products', () => {
    makeProductsState({ products: [] });
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

  it('Add to cart button calls addToCart with clamped qty', () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(mockAddToCart).toHaveBeenCalledWith('p1', 1);
  });

  it('shows review when product has reviews', () => {
    wrap();
    expect(screen.getByText('Great!')).toBeInTheDocument();
    expect(screen.getByText('Love it.')).toBeInTheDocument();
  });
});
