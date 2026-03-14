import { create } from "zustand";
import type { Address, Order, Payment, Product, User } from "../types/domain";
import api from "../utils/api";

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

export const useOrdersStore = create<OrdersState & OrdersActions>()((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  loadOrdersForUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/api/orders", { params: { userId } });
      set({ isLoading: false, orders: response.data, error: null });
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.response?.data?.message || "Failed to load orders." 
      });
    }
  },

  placeOrder: async ({ items, shipping, billing, payment }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/api/orders", {
        items,
        shipping,
        billing,
        payment
      });
      const order = response.data;
      set({ 
        isLoading: false, 
        orders: [order, ...get().orders],
        error: null 
      });
      return order;
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.response?.data?.message || "Failed to place order." 
      });
      return null;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ isLoading: true });
    try {
      const response = await api.patch(`/api/admin/orders/${orderId}/status`, { status });
      const updatedOrder = response.data;
      const next = get().orders.map((o) => (o.id === orderId ? updatedOrder : o));
      set({ orders: next, isLoading: false, error: null });
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.response?.data?.message || "Failed to update order status." 
      });
    }
  }
}));
