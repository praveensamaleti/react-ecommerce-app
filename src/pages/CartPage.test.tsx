import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartPage } from './CartPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeFromCart, setQty } from '../store/slices/cartSlice';
import { useCartAutoTotals } from '../hooks/useCartAutoTotals';

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

const makeState = (cartOverrides: any = {}, productOverrides: any = {}) => {
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      cart: { items: [{ productId: 'p1', qty: 1 }], totals, ...cartOverrides },
      products: { products: [product], isLoading: false, error: null, ...productOverrides },
    })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockResolvedValue(undefined);
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
  makeState();
});

const wrap = () => render(<MemoryRouter><CartPage /></MemoryRouter>);

describe('CartPage', () => {
  it('shows EmptyState when items=[]', () => {
    makeState({ items: [] });
    wrap();
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('shows LoadingSpinner when isLoading and no products', () => {
    makeState({}, { isLoading: true, products: [] });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows cart item with product name', () => {
    wrap();
    expect(screen.getByText('Cart Item')).toBeInTheDocument();
  });

  it('remove button dispatches removeFromCart', () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /remove cart item from cart/i }));
    expect(mockDispatch).toHaveBeenCalledWith(removeFromCart('p1'));
  });

  it('qty change dispatches setQty', () => {
    wrap();
    fireEvent.change(screen.getByLabelText(/quantity for cart item/i), { target: { value: '3' } });
    expect(mockDispatch).toHaveBeenCalledWith(setQty({ productId: 'p1', qty: 3 }));
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
