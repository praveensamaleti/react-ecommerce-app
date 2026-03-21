import { configureStore } from "@reduxjs/toolkit";
import productsReducer, {
  loadProductsThunk,
  upsertProductThunk,
  deleteProductThunk,
  setFiltersQuery,
  setFiltersCategory,
  setFiltersPriceRange,
  setFiltersPage,
  setFiltersPageSize,
  resetFilters,
  selectFilteredProducts,
  DEFAULT_FILTERS,
} from "./productsSlice";
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

const mockProduct = {
  id: "p1",
  name: "Widget",
  price: 99,
  images: ["img.jpg"],
  category: "Electronics" as const,
  stock: 10,
  rating: 4,
  ratingCount: 5,
  description: "desc",
  specs: {},
  reviews: [],
};

function makeStore() {
  return configureStore({ reducer: { products: productsReducer } });
}

let store: ReturnType<typeof makeStore>;

beforeEach(() => {
  store = makeStore();
  jest.clearAllMocks();
});

describe("loadProducts", () => {
  it("success sets products and totalCount", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { products: [mockProduct], totalCount: 1 },
    });

    await store.dispatch(loadProductsThunk());

    const s = store.getState().products;
    expect(s.products).toEqual([mockProduct]);
    expect(s.totalCount).toBe(1);
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });

  it("failure sets error", async () => {
    mockApi.get.mockRejectedValueOnce({
      response: { data: { message: "Server error" } },
    });

    await store.dispatch(loadProductsThunk());

    expect(store.getState().products.error).toBe("Server error");
    expect(store.getState().products.isLoading).toBe(false);
  });

  it("uses fallback error message when no response data", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("Network"));

    await store.dispatch(loadProductsThunk());

    expect(store.getState().products.error).toBe("Failed to load products.");
  });
});

describe("filter actions", () => {
  it("setFiltersQuery updates query and resets page to 0", () => {
    store.dispatch(setFiltersPage(2));
    store.dispatch(setFiltersQuery("laptop"));

    const f = store.getState().products.filters;
    expect(f.query).toBe("laptop");
    expect(f.page).toBe(0);
  });

  it("setFiltersCategory updates category and resets page", () => {
    store.dispatch(setFiltersPage(3));
    store.dispatch(setFiltersCategory("Electronics"));

    const f = store.getState().products.filters;
    expect(f.category).toBe("Electronics");
    expect(f.page).toBe(0);
  });

  it("setFiltersPriceRange updates prices and resets page", () => {
    store.dispatch(setFiltersPage(3));
    store.dispatch(setFiltersPriceRange({ minPrice: 10, maxPrice: 500 }));

    const f = store.getState().products.filters;
    expect(f.minPrice).toBe(10);
    expect(f.maxPrice).toBe(500);
    expect(f.page).toBe(0);
  });

  it("setFiltersPage updates page", () => {
    store.dispatch(setFiltersPage(2));
    expect(store.getState().products.filters.page).toBe(2);
  });

  it("setFiltersPageSize updates pageSize and resets page", () => {
    store.dispatch(setFiltersPage(2));
    store.dispatch(setFiltersPageSize(16));

    const f = store.getState().products.filters;
    expect(f.pageSize).toBe(16);
    expect(f.page).toBe(0);
  });

  it("resetFilters restores default filters", () => {
    store.dispatch(setFiltersQuery("laptop"));
    store.dispatch(setFiltersCategory("Electronics"));
    store.dispatch(setFiltersPage(3));
    store.dispatch(resetFilters());

    expect(store.getState().products.filters).toEqual(DEFAULT_FILTERS);
  });
});

describe("upsertProduct", () => {
  it("creates a new product via POST and prepends to list", async () => {
    const newProduct = { ...mockProduct, id: "p99" };
    mockApi.post.mockResolvedValueOnce({ data: newProduct });
    store.dispatch({
      type: "products/load/fulfilled",
      payload: { products: [mockProduct], totalCount: 1 },
    });

    await store.dispatch(upsertProductThunk({ ...newProduct, id: "" } as any));

    const products = store.getState().products.products;
    expect(products[0].id).toBe("p99");
    expect(products).toHaveLength(2);
  });

  it("updates an existing product via PUT", async () => {
    const updated = { ...mockProduct, name: "Updated Widget" };
    mockApi.put.mockResolvedValueOnce({ data: updated });
    store.dispatch({
      type: "products/load/fulfilled",
      payload: { products: [mockProduct], totalCount: 1 },
    });

    await store.dispatch(upsertProductThunk(updated));

    expect(store.getState().products.products[0].name).toBe("Updated Widget");
  });

  it("sets error on failure", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { message: "Save failed" } },
    });

    await store.dispatch(upsertProductThunk({ ...mockProduct, id: "" } as any));

    expect(store.getState().products.error).toBe("Save failed");
  });
});

describe("deleteProduct", () => {
  it("removes product from list", async () => {
    mockApi.delete.mockResolvedValueOnce({});
    store.dispatch({
      type: "products/load/fulfilled",
      payload: { products: [mockProduct], totalCount: 1 },
    });

    await store.dispatch(deleteProductThunk("p1"));

    expect(store.getState().products.products).toHaveLength(0);
  });

  it("sets error on failure", async () => {
    mockApi.delete.mockRejectedValueOnce({
      response: { data: { message: "Delete failed" } },
    });

    await store.dispatch(deleteProductThunk("p1"));

    expect(store.getState().products.error).toBe("Delete failed");
  });
});

describe("selectFilteredProducts", () => {
  it("returns state.products.products as-is", () => {
    store.dispatch({
      type: "products/load/fulfilled",
      payload: { products: [mockProduct], totalCount: 1 },
    });
    const state = store.getState();
    expect(selectFilteredProducts(state)).toBe(state.products.products);
  });
});
