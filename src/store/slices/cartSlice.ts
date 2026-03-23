import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, Product } from "../../types/domain";
import { fetchServerCart, syncServerCart } from "../../utils/cartApi";

type CartTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
};

type CartState = {
  items: CartItem[];
  totals: CartTotals;
  serverSynced: boolean;
};

const initialTotals: CartTotals = {
  subtotal: 0,
  discount: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
};

const initialState: CartState = {
  items: [],
  totals: { ...initialTotals },
  serverSynced: false,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Stable composite key that uniquely identifies a cart line.
 * Products without variants use productId alone.
 */
function itemKey(productId: string, variantId: string | undefined): string {
  return variantId ? `${productId}__${variantId}` : productId;
}

function computeTotals(items: CartItem[], products: Product[]): CartTotals {
  const productMap = new Map(products.map((p) => [p.id, p]));

  const subtotal = items.reduce((sum, it) => {
    const product = productMap.get(it.productId);
    if (!product) return sum;

    let unitPrice = product.price;
    if (it.variantId && product.variants?.length) {
      const variant = product.variants.find((v) => v.id === it.variantId);
      if (variant?.price != null) unitPrice = variant.price;
    }

    return sum + unitPrice * it.qty;
  }, 0);

  const itemCount = items.reduce((sum, it) => sum + it.qty, 0);
  const discount = subtotal * 0.1;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * 0.08;
  const total = taxable + tax;
  return { subtotal, discount, tax, total, itemCount };
}

// ------------------------------------------------------------------
// Server sync thunks
// ------------------------------------------------------------------

export const loadCartThunk = createAsyncThunk(
  "cart/loadFromServer",
  async () => {
    const response = await fetchServerCart();
    return response.data.items as CartItem[];
  }
);

export const syncCartThunk = createAsyncThunk(
  "cart/syncWithServer",
  async (items: CartItem[]) => {
    const response = await syncServerCart(items);
    return response.data.items as CartItem[];
  }
);

// ------------------------------------------------------------------
// Slice
// ------------------------------------------------------------------

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(
      state,
      action: PayloadAction<{ productId: string; qty?: number; variantId?: string }>
    ) {
      const { productId, qty = 1, variantId } = action.payload;
      const nextQty = clamp(qty, 1, 99);
      const key = itemKey(productId, variantId);
      const existing = state.items.find(
        (i) => itemKey(i.productId, i.variantId) === key
      );
      if (existing) {
        existing.qty = clamp(existing.qty + nextQty, 1, 99);
      } else {
        state.items.push({ productId, qty: nextQty, variantId });
      }
    },

    removeFromCart(
      state,
      action: PayloadAction<{ productId: string; variantId?: string }>
    ) {
      const { productId, variantId } = action.payload;
      const key = itemKey(productId, variantId);
      state.items = state.items.filter(
        (i) => itemKey(i.productId, i.variantId) !== key
      );
    },

    setQty(
      state,
      action: PayloadAction<{ productId: string; qty: number; variantId?: string }>
    ) {
      const { productId, qty, variantId } = action.payload;
      const key = itemKey(productId, variantId);
      const item = state.items.find(
        (i) => itemKey(i.productId, i.variantId) === key
      );
      if (item) item.qty = clamp(qty, 1, 99);
    },

    clearCart(state) {
      state.items = [];
      state.totals = { ...initialTotals };
      state.serverSynced = false;
    },

    recomputeTotals(state, action: PayloadAction<Product[]>) {
      const next = computeTotals(state.items, action.payload);
      const changed =
        next.subtotal !== state.totals.subtotal ||
        next.discount !== state.totals.discount ||
        next.tax !== state.totals.tax ||
        next.total !== state.totals.total ||
        next.itemCount !== state.totals.itemCount;
      if (changed) state.totals = next;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCartThunk.fulfilled, (state, action) => {
        state.items = action.payload;
        state.serverSynced = true;
      })
      .addCase(syncCartThunk.fulfilled, (state, action) => {
        state.items = action.payload;
        state.serverSynced = true;
      });
  },
});

export const { addToCart, removeFromCart, setQty, clearCart, recomputeTotals } =
  cartSlice.actions;

// ------------------------------------------------------------------
// Composite thunks — mutate locally then sync to server when authed
// ------------------------------------------------------------------

type CartThunkState = {
  auth: { token: string | null };
  cart: { items: CartItem[] };
};

export const addToCartThunk = createAsyncThunk(
  "cart/addItem",
  async (
    payload: { productId: string; qty?: number; variantId?: string },
    { dispatch, getState }
  ) => {
    dispatch(addToCart(payload));
    const state = getState() as CartThunkState;
    if (state.auth.token) {
      await dispatch(syncCartThunk(state.cart.items));
    }
  }
);

export const removeFromCartThunk = createAsyncThunk(
  "cart/removeItem",
  async (
    payload: { productId: string; variantId?: string },
    { dispatch, getState }
  ) => {
    dispatch(removeFromCart(payload));
    const state = getState() as CartThunkState;
    if (state.auth.token) {
      await dispatch(syncCartThunk(state.cart.items));
    }
  }
);

export const setQtyThunk = createAsyncThunk(
  "cart/setItemQty",
  async (
    payload: { productId: string; qty: number; variantId?: string },
    { dispatch, getState }
  ) => {
    dispatch(setQty(payload));
    const state = getState() as CartThunkState;
    if (state.auth.token) {
      await dispatch(syncCartThunk(state.cart.items));
    }
  }
);

export default cartSlice.reducer;
