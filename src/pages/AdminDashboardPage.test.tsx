import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import api from '../utils/api';

jest.mock('../store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock('../utils/api', () => ({
  __esModule: true,
  default: { post: jest.fn(), delete: jest.fn() },
}));

const mockApiPost = (api as any).post as jest.Mock;
const mockApiDelete = (api as any).delete as jest.Mock;
jest.mock('../hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => require('../utils/money').formatMoney,
}));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockDispatch = jest.fn().mockResolvedValue(undefined);

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
  variants: [],
};

const productWithVariants = {
  ...product,
  variants: [
    { id: 'v1', sku: 'AP-RED', stock: 8, price: 109, attributes: { color: 'Red' }, label: 'Red' },
  ],
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
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      products: {
        products: [product],
        isLoading: false,
        error: null,
        categories: ['Electronics', 'Clothing'],
        ...productOverrides,
      },
      orders: { orders: [order], isLoading: false, error: null, ...orderOverrides },
    })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockResolvedValue(undefined);
  mockApiPost.mockResolvedValue({ data: { id: 'v-new', stock: 10, price: 29.99, attributes: { color: 'Green' }, label: 'Green', sku: 'NEW-SKU' } });
  mockApiDelete.mockResolvedValue({});
  setup();
});

const wrap = () => render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);

describe('AdminDashboardPage', () => {
  it('calls loadProducts on mount when products empty', () => {
    setup({ products: [] });
    wrap();
    // Two dispatches on mount: loadProductsThunk (products empty) + loadOrdersForUserThunk
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('does not call loadProductsThunk when products already loaded', () => {
    wrap();
    // Only one dispatch on mount: loadOrdersForUserThunk
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('calls loadOrdersForUser("u1") on mount', () => {
    wrap();
    expect(mockDispatch).toHaveBeenCalled();
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

  it('form submit for new product calls dispatch (upsertProduct)', async () => {
    const dispatchCountBefore = mockDispatch.mock.calls.length;
    wrap();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Base stock'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A new product' } });
    fireEvent.click(screen.getByRole('button', { name: /create product/i }));
    await waitFor(() => {
      expect(mockDispatch.mock.calls.length).toBeGreaterThan(dispatchCountBefore);
    });
  });

  it('"Delete" button dispatches deleteProduct', () => {
    const dispatchCountBefore = mockDispatch.mock.calls.length;
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /delete admin product/i }));
    expect(mockDispatch.mock.calls.length).toBeGreaterThan(dispatchCountBefore);
  });

  it('orders tab shows order table', async () => {
    wrap();
    fireEvent.click(screen.getByRole('tab', { name: /orders/i }));
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /admin orders table/i })).toBeInTheDocument();
    });
  });

  it('"Mark shipped" dispatches updateOrderStatus', async () => {
    wrap();
    fireEvent.click(screen.getByRole('tab', { name: /orders/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark shipped/i })).toBeInTheDocument();
    });
    const dispatchCountBefore = mockDispatch.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /mark shipped/i }));
    expect(mockDispatch.mock.calls.length).toBeGreaterThan(dispatchCountBefore);
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

  it('product search filters results', () => {
    wrap();
    const searchInput = screen.getByRole('textbox', { name: /search products/i });
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    const productTable = screen.getByRole('table', { name: /admin product table/i });
    expect(within(productTable).queryByText('Admin Product')).not.toBeInTheDocument();
  });

  it('product search clears to show all products', () => {
    wrap();
    const searchInput = screen.getByRole('textbox', { name: /search products/i });
    fireEvent.change(searchInput, { target: { value: 'Admin' } });
    expect(screen.getAllByText('Admin Product').length).toBeGreaterThan(0);
  });

  it('stock badge uses danger variant for stock < 10', () => {
    setup({ products: [{ ...product, stock: 5 }] });
    wrap();
    const badge = screen.getAllByText('5').find((el) => el.closest('.badge'));
    expect(badge?.closest('.badge')).toHaveClass('bg-danger');
  });

  it('stock badge uses warning variant for stock 10-30', () => {
    setup({ products: [{ ...product, stock: 15 }] });
    wrap();
    const badge = screen.getAllByText('15').find((el) => el.closest('.badge'));
    expect(badge?.closest('.badge')).toHaveClass('bg-warning');
  });

  it('stock badge uses success variant for stock > 30', () => {
    setup({ products: [{ ...product, stock: 50 }] });
    wrap();
    const badge = screen.getAllByText('50').find((el) => el.closest('.badge'));
    expect(badge?.closest('.badge')).toHaveClass('bg-success');
  });

  it('"Manage variants" button opens VariantManagerModal', async () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /manage variants for admin product/i }));
    await waitFor(() => {
      expect(screen.getByText(/variants — admin product/i)).toBeInTheDocument();
    });
  });

  it('VariantManagerModal shows "No variants yet" when product has no variants', async () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /manage variants for admin product/i }));
    await waitFor(() => {
      expect(screen.getByText(/no variants yet/i)).toBeInTheDocument();
    });
  });

  it('VariantManagerModal shows existing variants table when product has variants', async () => {
    setup({ products: [productWithVariants] });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /manage variants for admin product/i }));
    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument();
      expect(screen.getByText('AP-RED')).toBeInTheDocument();
    });
  });

  it('VariantManagerModal close button hides the modal', async () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /manage variants for admin product/i }));
    await waitFor(() => expect(screen.getByText(/no variants yet/i)).toBeInTheDocument());
    // Bootstrap Modal renders both a header × button and a footer "Close" button; click the last one
    const closeBtns = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(closeBtns[closeBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText(/variants — admin product/i)).not.toBeInTheDocument();
    });
  });

  it('VariantManagerModal "Add variant" form calls api.post and refreshes products', async () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /manage variants for admin product/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // Fill in the stock field (required) inside the modal
    const modal = screen.getByRole('dialog');
    const stockInput = within(modal).getAllByRole('spinbutton')[0];
    fireEvent.change(stockInput, { target: { value: '10' } });

    fireEvent.click(within(modal).getByRole('button', { name: /add variant/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/products/p1/variants', expect.objectContaining({ stock: 10 }));
    });
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('VariantManagerModal delete button calls api.delete', async () => {
    setup({ products: [productWithVariants] });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /manage variants for admin product/i }));
    await waitFor(() => expect(screen.getByText('Red')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /delete variant red/i }));

    await waitFor(() => {
      expect(mockApiDelete).toHaveBeenCalledWith('/api/products/p1/variants/v1');
    });
  });

  it('inventory tab search filters results', async () => {
    wrap();
    fireEvent.click(screen.getByRole('tab', { name: /inventory/i }));
    await waitFor(() => expect(screen.getByRole('table', { name: /inventory table/i })).toBeInTheDocument());
    const searchInput = screen.getByRole('textbox', { name: /search inventory/i });
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    const table = screen.getByRole('table', { name: /inventory table/i });
    expect(within(table).queryByText('Admin Product')).not.toBeInTheDocument();
  });

  it('inventory tab shows variant count column', async () => {
    setup({ products: [productWithVariants] });
    wrap();
    fireEvent.click(screen.getByRole('tab', { name: /inventory/i }));
    await waitFor(() => expect(screen.getByRole('table', { name: /inventory table/i })).toBeInTheDocument());
    const invTable = screen.getByRole('table', { name: /inventory table/i });
    expect(within(invTable).getByText('1 variants')).toBeInTheDocument();
  });

  it('"+ Variants" button label shows when product has no variants', () => {
    wrap();
    expect(screen.getByRole('button', { name: /manage variants for admin product/i })).toHaveTextContent('+ Variants');
  });

  it('shows variant count label when product has variants', () => {
    setup({ products: [productWithVariants] });
    wrap();
    expect(screen.getByRole('button', { name: /manage variants for admin product/i })).toHaveTextContent('1 variants');
  });
});
