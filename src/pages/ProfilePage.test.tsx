import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateProfile } from '../store/slices/authSlice';

jest.mock('../store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockDispatch = jest.fn().mockResolvedValue(undefined);

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
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      auth: { user, ...authOverrides },
      orders: { orders: [order], isLoading: false, error: null, ...ordersOverrides },
    })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockResolvedValue(undefined);
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
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('profile form is pre-filled with user name and email', () => {
    wrap();
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@test.com')).toBeInTheDocument();
  });

  it('submit dispatches updateProfile', async () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        updateProfile({ name: 'Alice', email: 'alice@test.com' })
      );
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
