import { create } from "zustand";
import type { Category, Product } from "../types/domain";
import api from "../utils/api";

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
  totalCount: number;
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
  page: 0,
  pageSize: 8
};

export const useProductsStore = create<ProductsState & ProductsActions>()(
  (set, get) => ({
    products: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    filters: DEFAULT_FILTERS,

    loadProducts: async () => {
      set({ isLoading: true, error: null });
      const { filters } = get();
      
      try {
        const response = await api.get("/api/products", {
          params: {
            query: filters.query,
            category: filters.category === "All" ? undefined : filters.category,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            page: filters.page,
            pageSize: filters.pageSize
          }
        });
        
        const { products, totalCount } = response.data;
        
        set({
          isLoading: false,
          products,
          totalCount,
          error: null
        });
      } catch (err: any) {
        set({ 
          isLoading: false, 
          error: err.response?.data?.message || "Failed to load products." 
        });
      }
    },

    setQuery: (query) => {
      set({ filters: { ...get().filters, query, page: 0 } });
      get().loadProducts();
    },
    setCategory: (category) => {
      set({ filters: { ...get().filters, category, page: 0 } });
      get().loadProducts();
    },
    setPriceRange: (minPrice, maxPrice) => {
      set({ filters: { ...get().filters, minPrice, maxPrice, page: 0 } });
      get().loadProducts();
    },
    setPage: (page) => {
      set({ filters: { ...get().filters, page } });
      get().loadProducts();
    },
    setPageSize: (pageSize) => {
      set({ filters: { ...get().filters, pageSize, page: 0 } });
      get().loadProducts();
    },
    resetFilters: () => {
      set({ filters: { ...DEFAULT_FILTERS } });
      get().loadProducts();
    },

    upsertProduct: async (product) => {
      set({ isLoading: true });
      try {
        const isUpdate = !!product.id;
        const response = isUpdate 
          ? await api.put(`/api/products/${product.id}`, product)
          : await api.post("/api/products", product);
          
        const savedProduct = response.data;
        const current = get().products;
        const idx = current.findIndex((p) => p.id === savedProduct.id);
        const next = idx >= 0 
          ? current.map((p) => (p.id === savedProduct.id ? savedProduct : p)) 
          : [savedProduct, ...current];
          
        set({ products: next, isLoading: false });
      } catch (err: any) {
        set({ isLoading: false, error: err.response?.data?.message || "Failed to save product." });
      }
    },

    deleteProduct: async (id) => {
      set({ isLoading: true });
      try {
        await api.delete(`/api/products/${id}`);
        set({ 
          products: get().products.filter((p) => p.id !== id),
          isLoading: false 
        });
      } catch (err: any) {
        set({ isLoading: false, error: err.response?.data?.message || "Failed to delete product." });
      }
    }
  })
);

// Since we now have server-side filtering, we return all loaded products
export function selectFilteredProducts(state: ProductsState): Product[] {
  return state.products;
}
