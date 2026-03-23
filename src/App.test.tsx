import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { useCartAutoTotals } from './hooks/useCartAutoTotals';
import App from './App';

jest.mock('./store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock('./hooks/useCartAutoTotals');
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
  ToastContainer: () => null,
}));

const defaultFilters = { query: '', category: 'All', minPrice: 0, maxPrice: 1000, page: 0, pageSize: 8 };

const mockDispatch = jest.fn().mockResolvedValue(undefined);

const setupMocks = (user: any = null) => {
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      auth: { user, token: null, isLoading: false, error: null },
      cart: { items: [], totals: { subtotal: 0, discount: 0, tax: 0, total: 0, itemCount: 0 } },
      products: { products: [], totalCount: 0, isLoading: false, error: null, filters: defaultFilters, categories: [] },
      orders: { orders: [], isLoading: false, error: null },
      theme: { theme: 'light' },
      currency: { currency: 'USD' },
    })
  );
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockResolvedValue(undefined);
  setupMocks();
});

const renderAt = (path: string, user: any = null) => {
  setupMocks(user);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
};

describe('App routing', () => {
  it('/ renders HomePage', () => {
    renderAt('/');
    expect(screen.getByText(/your one-stop online store/i)).toBeInTheDocument();
  });

  it('/login renders LoginPage', () => {
    renderAt('/login');
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument();
  });

  it('/products renders ProductsPage', () => {
    renderAt('/products');
    expect(screen.getAllByRole('heading', { name: /products/i }).length).toBeGreaterThan(0);
  });

  it('/checkout unauthenticated redirects to /login', () => {
    renderAt('/checkout');
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument();
  });

  it('/profile unauthenticated redirects to /login', () => {
    renderAt('/profile');
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument();
  });

  it('/admin unauthenticated redirects to /login', () => {
    renderAt('/admin');
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument();
  });

  it('/admin with role=user redirects to /login', () => {
    const regularUser = { id: 'u1', name: 'Alice', email: 'a@a.com', role: 'user' };
    renderAt('/admin', regularUser);
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('/admin with role=admin renders AdminDashboardPage', () => {
    const admin = { id: 'u2', name: 'Admin', email: 'admin@test.com', role: 'admin' };
    renderAt('/admin', admin);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('unknown path redirects to /', () => {
    renderAt('/some-unknown-route');
    expect(screen.getByText(/your one-stop online store/i)).toBeInTheDocument();
  });

  it('/order-success renders OrderSuccessPage', () => {
    renderAt('/order-success');
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
