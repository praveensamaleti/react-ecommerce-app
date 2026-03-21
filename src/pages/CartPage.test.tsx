import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartPage } from './CartPage';
import { useCartStore } from '../stores/cartStore';
import { useProductsStore } from '../stores/productsStore';
import { useCartAutoTotals } from '../hooks/useCartAutoTotals';

jest.mock('../stores/cartStore');
jest.mock('../stores/productsStore');
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

const mockRemoveFromCart = jest.fn();
const mockSetQty = jest.fn();
const mockLoadProducts = jest.fn();

const product = {
  id: 'p1',
  name: 'Cart Item',
  price: 50,
  images: ['img.jpg'],
  category: 'Electronics' as const,
  stock: 10,
  rating: 4,
  ratingCount: 2,
  description: 'desc',
  specs: {},
  reviews: [],
};

const totals = { subtotal: 50, discount: 5, tax: 3.6, total: 48.6, itemCount: 1 };

const makeCartState = (overrides: any = {}) => {
  (useCartStore as jest.Mock).mockImplementation((selector: any) => {
    const state = {
      items: [{ productId: 'p1', qty: 1 }],
      totals,
      removeFromCart: mockRemoveFromCart,
      setQty: mockSetQty,
      ...overrides,
    };
    return typeof selector === 'function' ? selector(state) : state;
  });
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
  makeCartState();
  makeProductsState();
});

const wrap = () => render(<MemoryRouter><CartPage /></MemoryRouter>);

describe('CartPage', () => {
  it('shows EmptyState when items=[]', () => {
    makeCartState({ items: [] });
    wrap();
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('shows LoadingSpinner when isLoading and no products', () => {
    makeProductsState({ isLoading: true, products: [] });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows cart item with product name', () => {
    wrap();
    expect(screen.getByText('Cart Item')).toBeInTheDocument();
  });

  it('remove button calls removeFromCart', () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /remove cart item from cart/i }));
    expect(mockRemoveFromCart).toHaveBeenCalledWith('p1');
  });

  it('qty change calls setQty', () => {
    wrap();
    fireEvent.change(screen.getByLabelText(/quantity for cart item/i), { target: { value: '3' } });
    expect(mockSetQty).toHaveBeenCalledWith('p1', 3);
  });

  it('shows subtotal in order summary', () => {
    wrap();
    expect(screen.getAllByText('$50.00').length).toBeGreaterThan(0);
  });

  it('shows checkout link', () => {
    wrap();
    expect(screen.getByRole('link', { name: /proceed to checkout/i })).toBeInTheDocument();
  });
});
