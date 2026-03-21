import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from './CheckoutPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { placeOrderThunk } from '../store/slices/ordersSlice';
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

const user = { id: 'u1', name: 'Alice Smith', email: 'alice@test.com', role: 'user' as const };
const items = [{ productId: 'p1', qty: 1 }];
const totals = { subtotal: 100, discount: 10, tax: 7.2, total: 97.2, itemCount: 1 };
const products = [{
  id: 'p1', name: 'Widget', price: 100, images: ['img.jpg'],
  category: 'Electronics' as const, stock: 5, rating: 4, ratingCount: 2,
  description: 'desc', specs: {}, reviews: [],
}];

const setup = (overrides: any = {}) => {
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      auth: { user },
      cart: { items, totals },
      products: { products, isLoading: false },
      orders: { isLoading: false },
      ...overrides,
    })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockResolvedValue(undefined);
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
  setup();
});

const wrap = () => render(<MemoryRouter><CheckoutPage /></MemoryRouter>);

describe('CheckoutPage', () => {
  it('shows LoadingSpinner when productsLoading and no products', () => {
    setup({
      products: { products: [], isLoading: true },
    });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows "Please login" EmptyState when no user', () => {
    setup({ auth: { user: null } });
    wrap();
    expect(screen.getByText('Please login to checkout')).toBeInTheDocument();
  });

  it('shows "Cart is empty" EmptyState when items=[]', () => {
    setup({ cart: { items: [], totals } });
    wrap();
    expect(screen.getByText('Cart is empty')).toBeInTheDocument();
  });

  it('renders form when user + items present', () => {
    wrap();
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
  });

  it('shows validation errors when form submitted empty', async () => {
    setup({ auth: { user: { id: 'u1', name: '', email: '', role: 'user' as const } } });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));
    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
    });
  });

  it('calls placeOrderThunk and navigates on success', async () => {
    const mockOrder = { id: 'o1', userId: 'u1', createdAt: '', status: 'pending' as const, items: [], shipping: {} as any, billing: {} as any, subtotal: 0, discount: 0, tax: 0, total: 0 };
    const fulfilledResult = placeOrderThunk.fulfilled(mockOrder, 'reqId', { items, shipping: {} as any, billing: {} as any, payment: {} as any });
    mockDispatch.mockResolvedValueOnce(fulfilledResult);

    wrap();
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '555-1234' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '1 Main St' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'NY' } });
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'NY' } });
    fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: '10001' } });
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/order-success', expect.objectContaining({ state: { orderId: 'o1' } }));
    });
  });

  it('shows error toast and does not navigate when placeOrder fails', async () => {
    // Default mockDispatch resolves to undefined → fulfilled.match(undefined) = false
    const { toast } = require('react-toastify');
    wrap();

    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '555-1234' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '1 Main St' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'NY' } });
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'NY' } });
    fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: '10001' } });
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/order-success', expect.anything());
  });

  it('shows "Placing order..." button when orders loading', () => {
    setup({ orders: { isLoading: true } });
    wrap();
    expect(screen.getByRole('button', { name: /placing order/i })).toBeDisabled();
  });
});
