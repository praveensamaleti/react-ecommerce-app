import { create } from "zustand";
import type { Category, Product } from "../types/domain";
import { mockProducts } from "../data/mocks";
import { withDelay } from "../utils/mockApi";

export type ProductsFilters = {
  query: string;
  category: Category | "All";
  minPrice: number;
  maxPrice: number;
  page: number;
  pageSize: number;
};

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  filters: ProductsFilters;
};

type ProductsActions = {
  loadProducts: () => Promise<void>;
  setQuery: (query: string) => void;
  setCategory: (category: Category | "All") => void;
  setPriceRange: (minPrice: number, maxPrice: number) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetFilters: () => void;
  upsertProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
};

const DEFAULT_FILTERS: ProductsFilters = {
  query: "",
  category: "All",
  minPrice: 0,
  maxPrice: 1000,
  page: 1,
  pageSize: 8
};

export const useProductsStore = create<ProductsState & ProductsActions>()(
  (set, get) => ({
    products: [],
    isLoading: false,
    error: null,
    filters: DEFAULT_FILTERS,

    loadProducts: async () => {
      set({ isLoading: true, error: null });
      const res = await withDelay(() => mockProducts.slice(), 600);
      if (!res.ok) {
        set({ isLoading: false, error: res.error });
        return;
      }
      const max = Math.max(...res.data.map((p) => p.price), 1000);
      set({
        isLoading: false,
        products: res.data,
        filters: { ...get().filters, maxPrice: Math.ceil(max) }
      });
    },

    setQuery: (query) =>
      set({ filters: { ...get().filters, query, page: 1 } }),
    setCategory: (category) =>
      set({ filters: { ...get().filters, category, page: 1 } }),
    setPriceRange: (minPrice, maxPrice) =>
      set({ filters: { ...get().filters, minPrice, maxPrice, page: 1 } }),
    setPage: (page) => set({ filters: { ...get().filters, page } }),
    setPageSize: (pageSize) =>
      set({ filters: { ...get().filters, pageSize, page: 1 } }),
    resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

    upsertProduct: (product) => {
      const current = get().products;
      const idx = current.findIndex((p) => p.id === product.id);
      const next = idx >= 0 ? current.map((p) => (p.id === product.id ? product : p)) : [product, ...current];
      set({ products: next });
    },

    deleteProduct: (id) => {
      set({ products: get().products.filter((p) => p.id !== id) });
    }
  })
);

export function selectFilteredProducts(state: ProductsState): Product[] {
  const { products, filters } = state;
  const q = filters.query.trim().toLowerCase();
  return products.filter((p) => {
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    const matchesCategory =
      filters.category === "All" ? true : p.category === filters.category;
    const matchesPrice = p.price >= filters.minPrice && p.price <= filters.maxPrice;
    return matchesQuery && matchesCategory && matchesPrice;
  });
}

