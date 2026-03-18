import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { useAuthStore } from '../stores/authStore';
import { useOrdersStore } from '../stores/ordersStore';

jest.mock('../stores/authStore');
jest.mock('../stores/ordersStore');
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockUpdateProfile = jest.fn();
const mockLoadOrdersForUser = jest.fn();

const user = { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'user' as const };
const order = {
  id: 'o1',
  userId: 'u1',
  createdAt: '2024-01-15T00:00:00Z',
  status: 'pending' as const,
  items: [{ productId: 'p1', name: 'Widget', price: 100, qty: 2 }],
  shipping: {} as any,
  billing: {} as any,
  subtotal: 200,
  discount: 20,
  tax: 14.4,
  total: 194.4,
};

const setup = (authOverrides: any = {}, ordersOverrides: any = {}) => {
  (useAuthStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { user, updateProfile: mockUpdateProfile, ...authOverrides };
    return typeof selector === 'function' ? selector(state) : state;
  });
  (useOrdersStore as jest.Mock).mockImplementation((selector: any) => {
    const state = {
      orders: [order],
      isLoading: false,
      error: null,
      loadOrdersForUser: mockLoadOrdersForUser,
      ...ordersOverrides,
    };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  setup();
});

const wrap = () => render(<MemoryRouter><ProfilePage /></MemoryRouter>);

describe('ProfilePage', () => {
  it('returns null when no user', () => {
    setup({ user: null });
    const { container } = wrap();
    expect(container.firstChild).toBeNull();
  });

  it('calls loadOrdersForUser on mount', () => {
    wrap();
    expect(mockLoadOrdersForUser).toHaveBeenCalledWith('u1');
  });

  it('profile form is pre-filled with user name and email', () => {
    wrap();
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@test.com')).toBeInTheDocument();
  });

  it('submit calls updateProfile', async () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@test.com' });
    });
  });

  it('shows order history table with orders', () => {
    wrap();
    expect(screen.getByRole('table', { name: /order history table/i })).toBeInTheDocument();
    expect(screen.getByText('#o1')).toBeInTheDocument();
  });

  it('shows LoadingSpinner when isLoading=true', () => {
    setup({}, { isLoading: true });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error alert when error is set', () => {
    setup({}, { error: 'Failed to load orders' });
    wrap();
    expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
  });
});
