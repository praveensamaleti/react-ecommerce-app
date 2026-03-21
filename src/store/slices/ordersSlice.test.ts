import { configureStore } from "@reduxjs/toolkit";
import ordersReducer, {
  loadOrdersForUserThunk,
  placeOrderThunk,
  updateOrderStatusThunk,
} from "./ordersSlice";
import api from "../../utils/api";

jest.mock("../../utils/api", () => ({
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
  id: "o1",
  userId: "u1",
  createdAt: "2024-01-01T00:00:00Z",
  status: "pending" as const,
  items: [{ productId: "p1", name: "Widget", price: 100, qty: 2 }],
  shipping: {
    fullName: "Alice",
    email: "a@a.com",
    phone: "555",
    address1: "1 Main St",
    city: "NY",
    state: "NY",
    zip: "10001",
    country: "US",
  },
  billing: {
    fullName: "Alice",
    email: "a@a.com",
    phone: "555",
    address1: "1 Main St",
    city: "NY",
    state: "NY",
    zip: "10001",
    country: "US",
  },
  subtotal: 200,
  discount: 20,
  tax: 14.4,
  total: 194.4,
};

const placeOrderInput = {
  items: [{ productId: "p1", qty: 2 }],
  shipping: mockOrder.shipping,
  billing: mockOrder.billing,
  payment: {
    cardName: "Alice",
    cardNumber: "4242424242424242",
    exp: "12/30",
    cvc: "123",
  },
};

function makeStore() {
  return configureStore({ reducer: { orders: ordersReducer } });
}

let store: ReturnType<typeof makeStore>;

beforeEach(() => {
  store = makeStore();
  jest.clearAllMocks();
});

describe("loadOrdersForUser", () => {
  it("success sets orders", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [mockOrder] });

    await store.dispatch(loadOrdersForUserThunk("u1"));

    const s = store.getState().orders;
    expect(s.orders).toEqual([mockOrder]);
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });

  it("failure sets error", async () => {
    mockApi.get.mockRejectedValueOnce({
      response: { data: { message: "Load failed" } },
    });

    await store.dispatch(loadOrdersForUserThunk("u1"));

    expect(store.getState().orders.error).toBe("Load failed");
    expect(store.getState().orders.isLoading).toBe(false);
  });

  it("uses fallback message on failure", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("Network"));

    await store.dispatch(loadOrdersForUserThunk("u1"));

    expect(store.getState().orders.error).toBe("Failed to load orders.");
  });
});

describe("placeOrder", () => {
  it("success prepends order to list", async () => {
    const existing = { ...mockOrder, id: "o0" };
    store.dispatch({
      type: "orders/loadForUser/fulfilled",
      payload: [existing],
    });
    mockApi.post.mockResolvedValueOnce({ data: mockOrder });

    const result = await store.dispatch(placeOrderThunk(placeOrderInput));

    expect(placeOrderThunk.fulfilled.match(result)).toBe(true);
    const { orders } = store.getState().orders;
    expect(orders[0]).toEqual(mockOrder);
    expect(orders).toHaveLength(2);
  });

  it("failure sets error", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { message: "Place failed" } },
    });

    const result = await store.dispatch(placeOrderThunk(placeOrderInput));

    expect(placeOrderThunk.rejected.match(result)).toBe(true);
    expect(store.getState().orders.error).toBe("Place failed");
  });

  it("uses fallback message on failure", async () => {
    mockApi.post.mockRejectedValueOnce(new Error("Network"));

    await store.dispatch(placeOrderThunk(placeOrderInput));

    expect(store.getState().orders.error).toBe("Failed to place order.");
  });
});

describe("updateOrderStatus", () => {
  it("calls api.patch and updates order in list", async () => {
    const updated = { ...mockOrder, status: "shipped" as const };
    store.dispatch({
      type: "orders/loadForUser/fulfilled",
      payload: [mockOrder],
    });
    mockApi.patch.mockResolvedValueOnce({ data: updated });

    await store.dispatch(
      updateOrderStatusThunk({ orderId: "o1", status: "shipped" })
    );

    expect(store.getState().orders.orders[0].status).toBe("shipped");
    expect(store.getState().orders.isLoading).toBe(false);
  });

  it("sets error on failure", async () => {
    mockApi.patch.mockRejectedValueOnce({
      response: { data: { message: "Update failed" } },
    });

    await store.dispatch(
      updateOrderStatusThunk({ orderId: "o1", status: "shipped" })
    );

    expect(store.getState().orders.error).toBe("Update failed");
  });
});
