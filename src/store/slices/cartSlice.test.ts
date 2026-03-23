import { configureStore } from "@reduxjs/toolkit";
import cartReducer, {
  addToCart,
  removeFromCart,
  setQty,
  clearCart,
  recomputeTotals,
  loadCartThunk,
  syncCartThunk,
  addToCartThunk,
  removeFromCartThunk,
  setQtyThunk,
} from "./cartSlice";
import * as cartApi from "../../utils/cartApi";
import type { Product } from "../../types/domain";

jest.mock("../../utils/cartApi", () => ({
  fetchServerCart: jest.fn(),
  syncServerCart: jest.fn(),
}));

const mockFetchServerCart = cartApi.fetchServerCart as jest.Mock;
const mockSyncServerCart = cartApi.syncServerCart as jest.Mock;

const makeProduct = (id: string, price: number, stock = 10): Product => ({
  id,
  name: `Product ${id}`,
  price,
  images: ["img.jpg"],
  category: "Electronics",
  stock,
  rating: 4,
  ratingCount: 5,
  description: "desc",
  specs: {},
  reviews: [],
});

const initialTotals = {
  subtotal: 0,
  discount: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
};

function makeStore(extraReducers: Record<string, any> = {}) {
  return configureStore({ reducer: { cart: cartReducer, ...extraReducers } });
}

function makeAuthStore(token: string | null) {
  const authReducer = (state = { token }, action: any) => {
    if (action.type === "__setToken") return { token: action.payload };
    return state;
  };
  return configureStore({ reducer: { cart: cartReducer, auth: authReducer } });
}

let store: ReturnType<typeof makeStore>;

beforeEach(() => {
  store = makeStore();
  localStorage.clear();
  jest.clearAllMocks();
});

describe("initial state", () => {
  it("has empty items", () => {
    expect(store.getState().cart.items).toHaveLength(0);
  });

  it("has all-zero totals", () => {
    expect(store.getState().cart.totals).toEqual(initialTotals);
  });

  it("has serverSynced=false", () => {
    expect(store.getState().cart.serverSynced).toBe(false);
  });
});

describe("addToCart", () => {
  it("adds a new item with qty=1", () => {
    store.dispatch(addToCart({ productId: "p1" }));
    const { items } = store.getState().cart;
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ productId: "p1", qty: 1 });
  });

  it("increments qty when same product added again", () => {
    store.dispatch(addToCart({ productId: "p1" }));
    store.dispatch(addToCart({ productId: "p1" }));
    expect(store.getState().cart.items[0].qty).toBe(2);
  });

  it("clamps accumulated qty to 99", () => {
    store.dispatch(addToCart({ productId: "p1", qty: 50 }));
    store.dispatch(addToCart({ productId: "p1", qty: 60 }));
    expect(store.getState().cart.items[0].qty).toBe(99);
  });

  it("clamps initial qty 0 to 1", () => {
    store.dispatch(addToCart({ productId: "p1", qty: 0 }));
    expect(store.getState().cart.items[0].qty).toBe(1);
  });

  it("adds multiple distinct products", () => {
    store.dispatch(addToCart({ productId: "p1" }));
    store.dispatch(addToCart({ productId: "p2" }));
    expect(store.getState().cart.items).toHaveLength(2);
  });
});

describe("removeFromCart", () => {
  it("removes an existing item", () => {
    store.dispatch(addToCart({ productId: "p1" }));
    store.dispatch(removeFromCart({ productId: "p1" }));
    expect(store.getState().cart.items).toHaveLength(0);
  });

  it("does not throw for a missing id", () => {
    expect(() => store.dispatch(removeFromCart({ productId: "missing" }))).not.toThrow();
  });

  it("removes only the matching variant, leaves other variants", () => {
    store.dispatch(addToCart({ productId: "p1", variantId: "v1" }));
    store.dispatch(addToCart({ productId: "p1", variantId: "v2" }));
    store.dispatch(removeFromCart({ productId: "p1", variantId: "v1" }));
    const { items } = store.getState().cart;
    expect(items).toHaveLength(1);
    expect(items[0].variantId).toBe("v2");
  });

  it("does not remove no-variant item when removing a variant item", () => {
    store.dispatch(addToCart({ productId: "p1" }));
    store.dispatch(addToCart({ productId: "p1", variantId: "v1" }));
    store.dispatch(removeFromCart({ productId: "p1", variantId: "v1" }));
    const { items } = store.getState().cart;
    expect(items).toHaveLength(1);
    expect(items[0].variantId).toBeUndefined();
  });
});

describe("setQty", () => {
  it("sets quantity for existing item", () => {
    store.dispatch(addToCart({ productId: "p1" }));
    store.dispatch(setQty({ productId: "p1", qty: 5 }));
    expect(store.getState().cart.items[0].qty).toBe(5);
  });

  it("clamps qty to minimum 1", () => {
    store.dispatch(addToCart({ productId: "p1" }));
    store.dispatch(setQty({ productId: "p1", qty: 0 }));
    expect(store.getState().cart.items[0].qty).toBe(1);
  });

  it("clamps qty to maximum 99", () => {
    store.dispatch(addToCart({ productId: "p1" }));
    store.dispatch(setQty({ productId: "p1", qty: 150 }));
    expect(store.getState().cart.items[0].qty).toBe(99);
  });
});

describe("clearCart", () => {
  it("empties items and resets totals", () => {
    store.dispatch(addToCart({ productId: "p1" }));
    store.dispatch(clearCart());
    expect(store.getState().cart.items).toHaveLength(0);
    expect(store.getState().cart.totals).toEqual(initialTotals);
  });

  it("resets serverSynced to false", () => {
    // Simulate synced state via loadCartThunk
    mockFetchServerCart.mockResolvedValueOnce({ data: { items: [], hasOutOfStockItems: false } });
    store.dispatch(clearCart());
    expect(store.getState().cart.serverSynced).toBe(false);
  });
});

describe("recomputeTotals", () => {
  const p1 = makeProduct("p1", 100);
  const p2 = makeProduct("p2", 50);

  it("computes correct totals for one item", () => {
    store.dispatch(addToCart({ productId: "p1", qty: 2 }));
    store.dispatch(recomputeTotals([p1]));

    const { totals } = store.getState().cart;
    const subtotal = 200;
    const discount = 20;
    const taxable = 180;
    const tax = taxable * 0.08;
    const total = taxable + tax;

    expect(totals.subtotal).toBeCloseTo(subtotal);
    expect(totals.discount).toBeCloseTo(discount);
    expect(totals.tax).toBeCloseTo(tax);
    expect(totals.total).toBeCloseTo(total);
    expect(totals.itemCount).toBe(2);
  });

  it("computes correct totals for multiple items", () => {
    store.dispatch(addToCart({ productId: "p1", qty: 1 }));
    store.dispatch(addToCart({ productId: "p2", qty: 3 }));
    store.dispatch(recomputeTotals([p1, p2]));

    const { totals } = store.getState().cart;
    expect(totals.subtotal).toBeCloseTo(250);
    expect(totals.itemCount).toBe(4);
  });

  it("skips products not in the map (price treated as 0)", () => {
    store.dispatch(addToCart({ productId: "unknown", qty: 2 }));
    store.dispatch(recomputeTotals([p1]));
    expect(store.getState().cart.totals.subtotal).toBe(0);
  });

  it("does not re-set when values unchanged (hasChanged guard)", () => {
    store.dispatch(addToCart({ productId: "p1", qty: 1 }));
    store.dispatch(recomputeTotals([p1]));
    const totals1 = store.getState().cart.totals;

    store.dispatch(recomputeTotals([p1]));
    const totals2 = store.getState().cart.totals;

    expect(totals1).toBe(totals2);
  });

  it("uses variant price override when item has variantId", () => {
    const productWithVariant: Product = {
      ...p1,
      variants: [{ id: "v1", stock: 5, price: 150, attributes: {} }],
    };
    store.dispatch(addToCart({ productId: "p1", qty: 2, variantId: "v1" }));
    store.dispatch(recomputeTotals([productWithVariant]));

    // variant price 150 * 2 = 300, discount 10% = 30, taxable 270, tax 21.6
    const { totals } = store.getState().cart;
    expect(totals.subtotal).toBeCloseTo(300);
    expect(totals.discount).toBeCloseTo(30);
  });
});

describe("loadCartThunk", () => {
  it("replaces items with server cart on success", async () => {
    store.dispatch(addToCart({ productId: "p1", qty: 1 }));
    mockFetchServerCart.mockResolvedValueOnce({
      data: { items: [{ productId: "p2", qty: 3 }], hasOutOfStockItems: false },
    });

    await store.dispatch(loadCartThunk());

    const { items, serverSynced } = store.getState().cart;
    expect(items).toEqual([{ productId: "p2", qty: 3 }]);
    expect(serverSynced).toBe(true);
  });

  it("sets serverSynced=true on success", async () => {
    mockFetchServerCart.mockResolvedValueOnce({
      data: { items: [], hasOutOfStockItems: false },
    });

    await store.dispatch(loadCartThunk());

    expect(store.getState().cart.serverSynced).toBe(true);
  });

  it("does not update state on failure", async () => {
    store.dispatch(addToCart({ productId: "p1", qty: 1 }));
    mockFetchServerCart.mockRejectedValueOnce(new Error("Network error"));

    await store.dispatch(loadCartThunk());

    expect(store.getState().cart.items).toEqual([{ productId: "p1", qty: 1 }]);
    expect(store.getState().cart.serverSynced).toBe(false);
  });
});

describe("syncCartThunk", () => {
  it("replaces items with merged server cart on success", async () => {
    store.dispatch(addToCart({ productId: "p1", qty: 2 }));
    mockSyncServerCart.mockResolvedValueOnce({
      data: { items: [{ productId: "p1", qty: 2 }, { productId: "p2", qty: 1 }], hasOutOfStockItems: false },
    });

    await store.dispatch(syncCartThunk([{ productId: "p1", qty: 2 }]));

    const { items, serverSynced } = store.getState().cart;
    expect(items).toHaveLength(2);
    expect(serverSynced).toBe(true);
  });

  it("sets serverSynced=true on success", async () => {
    mockSyncServerCart.mockResolvedValueOnce({
      data: { items: [], hasOutOfStockItems: false },
    });

    await store.dispatch(syncCartThunk([]));

    expect(store.getState().cart.serverSynced).toBe(true);
  });

  it("passes local items to syncServerCart", async () => {
    const localItems = [{ productId: "p1", qty: 3 }];
    mockSyncServerCart.mockResolvedValueOnce({
      data: { items: localItems, hasOutOfStockItems: false },
    });

    await store.dispatch(syncCartThunk(localItems));

    expect(mockSyncServerCart).toHaveBeenCalledWith(localItems);
  });
});

describe("addToCartThunk", () => {
  it("adds item locally when no auth token", async () => {
    const s = makeAuthStore(null);
    await s.dispatch(addToCartThunk({ productId: "p1", qty: 2 }));
    expect(s.getState().cart.items).toEqual([{ productId: "p1", qty: 2 }]);
    expect(mockSyncServerCart).not.toHaveBeenCalled();
  });

  it("adds item and syncs when auth token present", async () => {
    const s = makeAuthStore("tok123");
    mockSyncServerCart.mockResolvedValueOnce({
      data: { items: [{ productId: "p1", qty: 2 }], hasOutOfStockItems: false },
    });
    await s.dispatch(addToCartThunk({ productId: "p1", qty: 2 }));
    expect(s.getState().cart.items).toEqual([{ productId: "p1", qty: 2 }]);
    expect(mockSyncServerCart).toHaveBeenCalledTimes(1);
  });

  it("supports variantId payload", async () => {
    const s = makeAuthStore(null);
    await s.dispatch(addToCartThunk({ productId: "p1", variantId: "v1" }));
    expect(s.getState().cart.items[0]).toEqual({ productId: "p1", qty: 1, variantId: "v1" });
  });
});

describe("removeFromCartThunk", () => {
  it("removes item locally when no auth token", async () => {
    const s = makeAuthStore(null);
    s.dispatch(addToCart({ productId: "p1" }));
    await s.dispatch(removeFromCartThunk({ productId: "p1" }));
    expect(s.getState().cart.items).toHaveLength(0);
    expect(mockSyncServerCart).not.toHaveBeenCalled();
  });

  it("removes item and syncs when auth token present", async () => {
    const s = makeAuthStore("tok123");
    s.dispatch(addToCart({ productId: "p1" }));
    mockSyncServerCart.mockResolvedValueOnce({
      data: { items: [], hasOutOfStockItems: false },
    });
    await s.dispatch(removeFromCartThunk({ productId: "p1" }));
    expect(s.getState().cart.items).toHaveLength(0);
    expect(mockSyncServerCart).toHaveBeenCalledTimes(1);
  });
});

describe("setQtyThunk", () => {
  it("updates qty locally when no auth token", async () => {
    const s = makeAuthStore(null);
    s.dispatch(addToCart({ productId: "p1" }));
    await s.dispatch(setQtyThunk({ productId: "p1", qty: 7 }));
    expect(s.getState().cart.items[0].qty).toBe(7);
    expect(mockSyncServerCart).not.toHaveBeenCalled();
  });

  it("updates qty and syncs when auth token present", async () => {
    const s = makeAuthStore("tok123");
    s.dispatch(addToCart({ productId: "p1" }));
    mockSyncServerCart.mockResolvedValueOnce({
      data: { items: [{ productId: "p1", qty: 7 }], hasOutOfStockItems: false },
    });
    await s.dispatch(setQtyThunk({ productId: "p1", qty: 7 }));
    expect(mockSyncServerCart).toHaveBeenCalledTimes(1);
  });
});
