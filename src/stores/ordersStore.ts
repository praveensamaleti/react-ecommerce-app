import { create } from "zustand";
import type { Address, Order, OrderItem, Payment, Product, User } from "../types/domain";
import { withDelay } from "../utils/mockApi";
import { mockOrders } from "../data/mocks";

type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
};

type PlaceOrderInput = {
  user: User;
  items: Array<{ productId: string; qty: number }>;
  products: Product[];
  shipping: Address;
  billing: Address;
  payment: Payment;
};

type OrdersActions = {
  loadOrdersForUser: (userId: string) => Promise<void>;
  placeOrder: (input: PlaceOrderInput) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
};

function computeOrderTotals(items: OrderItem[]) {
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const discount = subtotal * 0.1;
  const tax = Math.max(0, subtotal - discount) * 0.08;
  const total = Math.max(0, subtotal - discount) + tax;
  return { subtotal, discount, tax, total };
}

export const useOrdersStore = create<OrdersState & OrdersActions>()((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  loadOrdersForUser: async (userId) => {
    set({ isLoading: true, error: null });
    const res = await withDelay(() => mockOrders.filter((o) => o.userId === userId), 650);
    if (!res.ok) {
      set({ isLoading: false, error: res.error });
      return;
    }
    set({ isLoading: false, orders: res.data });
  },

  placeOrder: async ({ user, items, products, shipping, billing }) => {
    set({ isLoading: true, error: null });
    const res = await withDelay(() => {
      const productMap = new Map(products.map((p) => [p.id, p] as const));
      const orderItems: OrderItem[] = items.map((it) => {
        const p = productMap.get(it.productId);
        if (!p) throw new Error("Some cart items are no longer available.");
        return { productId: p.id, name: p.name, price: p.price, qty: it.qty };
      });
      const totals = computeOrderTotals(orderItems);
      const order: Order = {
        id: `o${Math.floor(Math.random() * 900000) + 100000}`,
        userId: user.id,
        createdAt: new Date().toISOString(),
        status: "pending",
        items: orderItems,
        shipping,
        billing,
        ...totals
      };
      mockOrders.unshift(order);
      return order;
    }, 900);

    if (!res.ok) {
      set({ isLoading: false, error: res.error });
      return null;
    }

    set({ isLoading: false, orders: [res.data, ...get().orders] });
    return res.data;
  },

  updateOrderStatus: (orderId, status) => {
    const next = get().orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    set({ orders: next });
    const idx = mockOrders.findIndex((o) => o.id === orderId);
    if (idx >= 0) mockOrders[idx] = { ...mockOrders[idx], status };
  }
}));

