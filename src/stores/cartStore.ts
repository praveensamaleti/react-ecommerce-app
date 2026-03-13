import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "../types/domain";
import { writeStorage } from "../utils/storage";

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

type CartActions = {
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  recomputeTotals: (products: Product[]) => void;
};

const STORAGE_KEY = "ecom_cart";

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

  return {
    subtotal,
    discount,
    tax,
    total,
    itemCount
  };
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      totals: { subtotal: 0, discount: 0, tax: 0, total: 0, itemCount: 0 },

      addToCart: (productId, qty = 1) => {
        const nextQty = clamp(qty, 1, 99);
        const items = get().items.slice();
        const existing = items.find((i) => i.productId === productId);
        if (existing) existing.qty = clamp(existing.qty + nextQty, 1, 99);
        else items.push({ productId, qty: nextQty });
        set({ items });
      },

      removeFromCart: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      setQty: (productId, qty) => {
        const next = clamp(qty, 1, 99);
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, qty: next } : i
          )
        });
      },

      clearCart: () => set({ items: [], totals: { subtotal: 0, discount: 0, tax: 0, total: 0, itemCount: 0 } }),

      recomputeTotals: (products) => {
        const nextTotals = computeTotals(get().items, products);
        const currentTotals = get().totals;

        // Only update if something actually changed to avoid infinite loops
        const hasChanged =
          nextTotals.subtotal !== currentTotals.subtotal ||
          nextTotals.discount !== currentTotals.discount ||
          nextTotals.tax !== currentTotals.tax ||
          nextTotals.total !== currentTotals.total ||
          nextTotals.itemCount !== currentTotals.itemCount;

        if (hasChanged) {
          set({ totals: nextTotals });
        }
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ items: s.items })
    }
  )
);

