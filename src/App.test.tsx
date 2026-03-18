import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useCartStore } from './stores/cartStore';
import { useProductsStore } from './stores/productsStore';
import { useOrdersStore } from './stores/ordersStore';
import { useCartAutoTotals } from './hooks/useCartAutoTotals';
import App from './App';

// Mock all stores and hooks to prevent real API calls
jest.mock('./stores/authStore');
jest.mock('./stores/cartStore');
jest.mock('./stores/productsStore');
jest.mock('./stores/ordersStore');
jest.mock('./hooks/useCartAutoTotals');
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
  ToastContainer: () => null,
}));

const defaultProducts = { products: [], totalCount: 0, isLoading: false, error: null, loadProducts: jest.fn(), filters: { query: '', category: 'All', minPrice: 0, maxPrice: 1000, page: 0, pageSize: 8 }, setQuery: jest.fn(), setCategory: jest.fn(), setPriceRange: jest.fn(), setPage: jest.fn(), setPageSize: jest.fn(), resetFilters: jest.fn() };
const defaultCart = { items: [], totals: { subtotal: 0, discount: 0, tax: 0, total: 0, itemCount: 0 }, addToCart: jest.fn(), removeFromCart: jest.fn(), setQty: jest.fn(), clearCart: jest.fn() };
const defaultOrders = { orders: [], isLoading: false, error: null, loadOrdersForUser: jest.fn(), placeOrder: jest.fn(), updateOrderStatus: jest.fn() };

const setupMocks = (user: any = null) => {
  (useAuthStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { user, token: null, isLoading: false, error: null, login: jest.fn(), logout: jest.fn(), register: jest.fn(), updateProfile: jest.fn(), clearError: jest.fn() };
    return typeof selector === 'function' ? selector(state) : state;
  });
  (useCartStore as jest.Mock).mockImplementation((selector: any) => {
    return typeof selector === 'function' ? selector(defaultCart) : defaultCart;
  });
  (useProductsStore as jest.Mock).mockImplementation((selector: any) => {
    return typeof selector === 'function' ? selector(defaultProducts) : defaultProducts;
  });
  (useOrdersStore as jest.Mock).mockImplementation((selector: any) => {
    return typeof selector === 'function' ? selector(defaultOrders) : defaultOrders;
  });
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
};

beforeEach(() => {
  jest.clearAllMocks();
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
    expect(screen.getByText(/shop smarter/i)).toBeInTheDocument();
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
    // Non-admin is redirected away; admin dashboard must not appear
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('/admin with role=admin renders AdminDashboardPage', () => {
    const admin = { id: 'u2', name: 'Admin', email: 'admin@test.com', role: 'admin' };
    renderAt('/admin', admin);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('unknown path redirects to /', () => {
    renderAt('/some-unknown-route');
    expect(screen.getByText(/shop smarter/i)).toBeInTheDocument();
  });

  it('/order-success renders OrderSuccessPage', () => {
    renderAt('/order-success');
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
