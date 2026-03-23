import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { Category, Product } from "../../types/domain";
import api from "../../utils/api";

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
  categories: string[];
};

export const DEFAULT_FILTERS: ProductsFilters = {
  query: "",
  category: "All",
  minPrice: 0,
  maxPrice: 1000,
  page: 0,
  pageSize: 8,
};

const initialState: ProductsState = {
  products: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  filters: { ...DEFAULT_FILTERS },
  categories: [],
};

export const loadCategoriesThunk = createAsyncThunk(
  "products/loadCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/products/categories");
      return response.data as string[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load categories."
      );
    }
  }
);

export const loadProductsThunk = createAsyncThunk(
  "products/load",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { products: ProductsState };
    const { filters } = state.products;
    try {
      const response = await api.get("/api/products", {
        params: {
          query: filters.query,
          category: filters.category === "All" ? undefined : filters.category,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          page: filters.page,
          pageSize: filters.pageSize,
        },
      });
      return response.data as { products: Product[]; totalCount: number };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load products."
      );
    }
  }
);

export const upsertProductThunk = createAsyncThunk(
  "products/upsert",
  async (product: Product, { rejectWithValue }) => {
    try {
      const isUpdate = !!product.id;
      const response = isUpdate
        ? await api.put(`/api/products/${product.id}`, product)
        : await api.post("/api/products", product);
      return response.data as Product;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to save product."
      );
    }
  }
);

export const deleteProductThunk = createAsyncThunk(
  "products/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/products/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete product."
      );
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setFiltersQuery(state, action: PayloadAction<string>) {
      state.filters.query = action.payload;
      state.filters.page = 0;
    },
    setFiltersCategory(state, action: PayloadAction<Category | "All">) {
      state.filters.category = action.payload;
      state.filters.page = 0;
    },
    setFiltersPriceRange(
      state,
      action: PayloadAction<{ minPrice: number; maxPrice: number }>
    ) {
      state.filters.minPrice = action.payload.minPrice;
      state.filters.maxPrice = action.payload.maxPrice;
      state.filters.page = 0;
    },
    setFiltersPage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload;
    },
    setFiltersPageSize(state, action: PayloadAction<number>) {
      state.filters.pageSize = action.payload;
      state.filters.page = 0;
    },
    resetFilters(state) {
      state.filters = { ...DEFAULT_FILTERS };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProductsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadProductsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.totalCount = action.payload.totalCount;
        state.error = null;
      })
      .addCase(loadProductsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(upsertProductThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(upsertProductThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        const savedProduct = action.payload;
        const idx = state.products.findIndex((p) => p.id === savedProduct.id);
        if (idx >= 0) {
          state.products[idx] = savedProduct;
        } else {
          state.products.unshift(savedProduct);
        }
      })
      .addCase(upsertProductThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteProductThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteProductThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProductThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loadCategoriesThunk.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const {
  setFiltersQuery,
  setFiltersCategory,
  setFiltersPriceRange,
  setFiltersPage,
  setFiltersPageSize,
  resetFilters,
} = productsSlice.actions;

export const selectFilteredProducts = (state: {
  products: ProductsState;
}): Product[] => state.products.products;

export const selectCategories = (state: {
  products: ProductsState;
}): string[] => state.products.categories;

export default productsSlice.reducer;
