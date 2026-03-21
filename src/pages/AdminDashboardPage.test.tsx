import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';
import { useProductsStore } from '../stores/productsStore';
import { useOrdersStore } from '../stores/ordersStore';

jest.mock('../stores/productsStore');
jest.mock('../stores/ordersStore');
jest.mock('../hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => require('../utils/money').formatMoney,
}));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockLoadProducts = jest.fn();
const mockUpsertProduct = jest.fn();
const mockDeleteProduct = jest.fn();
const mockLoadOrdersForUser = jest.fn();
const mockUpdateOrderStatus = jest.fn();

const product = {
  id: 'p1',
  name: 'Admin Product',
  price: 99,
  images: ['img.jpg'],
  category: 'Electronics' as const,
  stock: 15,
  rating: 4,
  ratingCount: 5,
  description: 'desc',
  specs: { Brand: 'Acme' },
  reviews: [],
};

const order = {
  id: 'o1',
  userId: 'u1',
  createdAt: '2024-01-01T00:00:00Z',
  status: 'pending' as const,
  items: [{ productId: 'p1', name: 'Admin Product', price: 99, qty: 1 }],
  shipping: {} as any,
  billing: {} as any,
  subtotal: 99,
  discount: 9.9,
  tax: 7.13,
  total: 96.23,
};

const setup = (productOverrides: any = {}, orderOverrides: any = {}) => {
  (useProductsStore as jest.Mock).mockImplementation((selector: any) => {
    const state = {
      products: [product],
      isLoading: false,
      error: null,
      loadProducts: mockLoadProducts,
      upsertProduct: mockUpsertProduct,
      deleteProduct: mockDeleteProduct,
      ...productOverrides,
    };
    return typeof selector === 'function' ? selector(state) : state;
  });
  (useOrdersStore as jest.Mock).mockImplementation((selector: any) => {
    const state = {
      orders: [order],
      loadOrdersForUser: mockLoadOrdersForUser,
      updateOrderStatus: mockUpdateOrderStatus,
      ...orderOverrides,
    };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  setup();
});

const wrap = () => render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);

describe('AdminDashboardPage', () => {
  it('calls loadProducts on mount when products empty', () => {
    setup({ products: [] });
    wrap();
    expect(mockLoadProducts).toHaveBeenCalledTimes(1);
  });

  it('does not call loadProducts when products already loaded', () => {
    wrap();
    expect(mockLoadProducts).not.toHaveBeenCalled();
  });

  it('calls loadOrdersForUser("u1") on mount', () => {
    wrap();
    expect(mockLoadOrdersForUser).toHaveBeenCalledWith('u1');
  });

  it('shows products in table', () => {
    wrap();
    expect(screen.getAllByText('Admin Product').length).toBeGreaterThan(0);
  });

  it('"Edit" button populates the form with product data', () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(screen.getByDisplayValue('Admin Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('99')).toBeInTheDocument();
  });

  it('"New product" button resets the form', () => {
    wrap();
    // First fill via edit
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    // Then click new product
    fireEvent.click(screen.getByRole('button', { name: /new product/i }));
    // Name should be blank
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('form submit for new product calls upsertProduct', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A new product' } });
    fireEvent.click(screen.getByRole('button', { name: /create product/i }));
    await waitFor(() => {
      expect(mockUpsertProduct).toHaveBeenCalled();
    });
  });

  it('"Delete" button calls deleteProduct', () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /delete admin product/i }));
    expect(mockDeleteProduct).toHaveBeenCalledWith('p1');
  });

  it('orders tab shows order table', async () => {
    wrap();
    fireEvent.click(screen.getByRole('tab', { name: /orders/i }));
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /admin orders table/i })).toBeInTheDocument();
    });
  });

  it('"Mark shipped" calls updateOrderStatus', async () => {
    wrap();
    fireEvent.click(screen.getByRole('tab', { name: /orders/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark shipped/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /mark shipped/i }));
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith('o1', 'shipped');
  });

  it('inventory tab shows products sorted by stock', async () => {
    wrap();
    fireEvent.click(screen.getByRole('tab', { name: /inventory/i }));
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /inventory table/i })).toBeInTheDocument();
    });
  });

  it('shows loading spinner when isLoading and no products', () => {
    setup({ isLoading: true, products: [] });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
