import { useOrdersStore } from './ordersStore';
import api from '../utils/api';

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockOrder = {
  id: 'o1',
  userId: 'u1',
  createdAt: '2024-01-01T00:00:00Z',
  status: 'pending' as const,
  items: [{ productId: 'p1', name: 'Widget', price: 100, qty: 2 }],
  shipping: { fullName: 'Alice', email: 'a@a.com', phone: '555', address1: '1 Main St', city: 'NY', state: 'NY', zip: '10001', country: 'US' },
  billing: { fullName: 'Alice', email: 'a@a.com', phone: '555', address1: '1 Main St', city: 'NY', state: 'NY', zip: '10001', country: 'US' },
  subtotal: 200,
  discount: 20,
  tax: 14.4,
  total: 194.4,
};

const placeOrderInput = {
  user: { id: 'u1', name: 'Alice', email: 'a@a.com', role: 'user' as const },
  items: [{ productId: 'p1', qty: 2 }],
  products: [] as any[],
  shipping: mockOrder.shipping,
  billing: mockOrder.billing,
  payment: { cardName: 'Alice', cardNumber: '4242424242424242', exp: '12/30', cvc: '123' },
};

beforeEach(() => {
  useOrdersStore.setState({ orders: [], isLoading: false, error: null });
  jest.clearAllMocks();
});

describe('loadOrdersForUser', () => {
  it('success sets orders', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [mockOrder] });

    await useOrdersStore.getState().loadOrdersForUser('u1');

    expect(useOrdersStore.getState().orders).toEqual([mockOrder]);
    expect(useOrdersStore.getState().isLoading).toBe(false);
    expect(useOrdersStore.getState().error).toBeNull();
  });

  it('failure sets error', async () => {
    mockApi.get.mockRejectedValueOnce({ response: { data: { message: 'Load failed' } } });

    await useOrdersStore.getState().loadOrdersForUser('u1');

    expect(useOrdersStore.getState().error).toBe('Load failed');
    expect(useOrdersStore.getState().isLoading).toBe(false);
  });

  it('uses fallback message on failure', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network'));

    await useOrdersStore.getState().loadOrdersForUser('u1');

    expect(useOrdersStore.getState().error).toBe('Failed to load orders.');
  });
});

describe('placeOrder', () => {
  it('success prepends order and returns it', async () => {
    const existing = { ...mockOrder, id: 'o0' };
    useOrdersStore.setState({ orders: [existing] });
    mockApi.post.mockResolvedValueOnce({ data: mockOrder });

    const result = await useOrdersStore.getState().placeOrder(placeOrderInput);

    expect(result).toEqual(mockOrder);
    const { orders } = useOrdersStore.getState();
    expect(orders[0]).toEqual(mockOrder);
    expect(orders).toHaveLength(2);
  });

  it('failure sets error and returns null', async () => {
    mockApi.post.mockRejectedValueOnce({ response: { data: { message: 'Place failed' } } });

    const result = await useOrdersStore.getState().placeOrder(placeOrderInput);

    expect(result).toBeNull();
    expect(useOrdersStore.getState().error).toBe('Place failed');
  });

  it('uses fallback message on failure', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Network'));

    const result = await useOrdersStore.getState().placeOrder(placeOrderInput);

    expect(result).toBeNull();
    expect(useOrdersStore.getState().error).toBe('Failed to place order.');
  });
});

describe('updateOrderStatus', () => {
  it('calls api.patch and updates order in list', async () => {
    const updated = { ...mockOrder, status: 'shipped' as const };
    useOrdersStore.setState({ orders: [mockOrder] });
    mockApi.patch.mockResolvedValueOnce({ data: updated });

    await useOrdersStore.getState().updateOrderStatus('o1', 'shipped');

    expect(useOrdersStore.getState().orders[0].status).toBe('shipped');
    expect(useOrdersStore.getState().isLoading).toBe(false);
  });

  it('sets error on failure', async () => {
    mockApi.patch.mockRejectedValueOnce({ response: { data: { message: 'Update failed' } } });

    await useOrdersStore.getState().updateOrderStatus('o1', 'shipped');

    expect(useOrdersStore.getState().error).toBe('Update failed');
  });
});
