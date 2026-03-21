import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, Product } from "../../types/domain";

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
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function computeTotals(items: CartItem[], products: Product[]): CartTotals {
  const map = new Map(products.map((p) => [p.id, p] as const));
  const subtotal = items.reduce((sum, it) => {
    const p = map.get(it.productId);
    if (!p) return sum;
    return sum + p.price * it.qty;
  }, 0);
  const itemCount = items.reduce((sum, it) => sum + it.qty, 0);
  const discount = subtotal * 0.1; // mock 10% discount
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * 0.08; // mock 8% tax
  const total = taxable + tax;
  return { subtotal, discount, tax, total, itemCount };
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(
      state,
      action: PayloadAction<{ productId: string; qty?: number }>
    ) {
      const { productId, qty = 1 } = action.payload;
      const nextQty = clamp(qty, 1, 99);
      const existing = state.items.find((i) => i.productId === productId);
      if (existing) {
        existing.qty = clamp(existing.qty + nextQty, 1, 99);
      } else {
        state.items.push({ productId, qty: nextQty });
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
    },
    setQty(state, action: PayloadAction<{ productId: string; qty: number }>) {
      const { productId, qty } = action.payload;
      const next = clamp(qty, 1, 99);
      const item = state.items.find((i) => i.productId === productId);
      if (item) {
        item.qty = next;
      }
    },
    clearCart(state) {
      state.items = [];
      state.totals = { ...initialTotals };
    },
    recomputeTotals(state, action: PayloadAction<Product[]>) {
      const nextTotals = computeTotals(state.items, action.payload);
      const hasChanged =
        nextTotals.subtotal !== state.totals.subtotal ||
        nextTotals.discount !== state.totals.discount ||
        nextTotals.tax !== state.totals.tax ||
        nextTotals.total !== state.totals.total ||
        nextTotals.itemCount !== state.totals.itemCount;
      if (hasChanged) {
        state.totals = nextTotals;
      }
    },
  },
});

export const { addToCart, removeFromCart, setQty, clearCart, recomputeTotals } =
  cartSlice.actions;
export default cartSlice.reducer;
