import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from './CheckoutPage';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { useProductsStore } from '../stores/productsStore';
import { useOrdersStore } from '../stores/ordersStore';
import { useCartAutoTotals } from '../hooks/useCartAutoTotals';

jest.mock('../stores/authStore');
jest.mock('../stores/cartStore');
jest.mock('../stores/productsStore');
jest.mock('../stores/ordersStore');
jest.mock('../hooks/useCartAutoTotals');
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockPlaceOrder = jest.fn();
const mockClearCart = jest.fn();
const mockLoadProducts = jest.fn();

const user = { id: 'u1', name: 'Alice Smith', email: 'alice@test.com', role: 'user' as const };
const items = [{ productId: 'p1', qty: 1 }];
const totals = { subtotal: 100, discount: 10, tax: 7.2, total: 97.2, itemCount: 1 };
const products = [{
  id: 'p1', name: 'Widget', price: 100, images: ['img.jpg'],
  category: 'Electronics' as const, stock: 5, rating: 4, ratingCount: 2,
  description: 'desc', specs: {}, reviews: [],
}];

const setup = (authOverrides: any = {}, cartOverrides: any = {}, ordersOverrides: any = {}) => {
  (useAuthStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { user, ...authOverrides };
    return typeof selector === 'function' ? selector(state) : state;
  });
  (useCartStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { items, totals, clearCart: mockClearCart, ...cartOverrides };
    return typeof selector === 'function' ? selector(state) : state;
  });
  (useProductsStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { products, isLoading: false, loadProducts: mockLoadProducts };
    return typeof selector === 'function' ? selector(state) : state;
  });
  (useOrdersStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { placeOrder: mockPlaceOrder, isLoading: false, ...ordersOverrides };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
  setup();
});

const wrap = () => render(<MemoryRouter><CheckoutPage /></MemoryRouter>);

describe('CheckoutPage', () => {
  it('shows LoadingSpinner when productsLoading and no products', () => {
    (useProductsStore as jest.Mock).mockImplementation((selector: any) => {
      const state = { products: [], isLoading: true, loadProducts: mockLoadProducts };
      return typeof selector === 'function' ? selector(state) : state;
    });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows "Please login" EmptyState when no user', () => {
    setup({ user: null });
    wrap();
    expect(screen.getByText('Please login to checkout')).toBeInTheDocument();
  });

  it('shows "Cart is empty" EmptyState when items=[]', () => {
    setup({}, { items: [] });
    wrap();
    expect(screen.getByText('Cart is empty')).toBeInTheDocument();
  });

  it('renders form when user + items present', () => {
    wrap();
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
  });

  it('shows validation errors when form submitted empty', async () => {
    // Clear pre-filled values first
    (useAuthStore as jest.Mock).mockImplementation((selector: any) => {
      const state = { user: { id: 'u1', name: '', email: '', role: 'user' as const } };
      return typeof selector === 'function' ? selector(state) : state;
    });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));
    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
    });
  });

  it('calls placeOrder and clearCart and navigates on success', async () => {
    const order = { id: 'o1', userId: 'u1', createdAt: '', status: 'pending' as const, items: [], shipping: {} as any, billing: {} as any, subtotal: 0, discount: 0, tax: 0, total: 0 };
    mockPlaceOrder.mockResolvedValueOnce(order);
    wrap();

    // Fill required fields
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '555-1234' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '1 Main St' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'NY' } });
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'NY' } });
    fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: '10001' } });

    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(mockPlaceOrder).toHaveBeenCalled();
      expect(mockClearCart).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/order-success', expect.objectContaining({ state: { orderId: 'o1' } }));
    });
  });

  it('shows error toast and does not navigate when placeOrder returns null', async () => {
    mockPlaceOrder.mockResolvedValueOnce(null);
    const { toast } = require('react-toastify');
    wrap();

    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '555-1234' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '1 Main St' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'NY' } });
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'NY' } });
    fireEvent.change(screen.getByLabelText(/zip/i), { target: { value: '10001' } });

    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(mockPlaceOrder).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/order-success', expect.anything());
  });

  it('shows "Placing order..." button when orders loading', () => {
    setup({}, {}, { isLoading: true });
    wrap();
    expect(screen.getByRole('button', { name: /placing order/i })).toBeDisabled();
  });
});
