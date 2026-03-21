import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Address, Order, Payment } from "../../types/domain";
import api from "../../utils/api";

type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
};

const initialState: OrdersState = {
  orders: [],
  isLoading: false,
  error: null,
};

export const loadOrdersForUserThunk = createAsyncThunk(
  "orders/loadForUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/orders", { params: { userId } });
      return response.data as Order[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load orders."
      );
    }
  }
);

type PlaceOrderInput = {
  items: Array<{ productId: string; qty: number }>;
  shipping: Address;
  billing: Address;
  payment: Payment;
};

export const placeOrderThunk = createAsyncThunk(
  "orders/place",
  async (input: PlaceOrderInput, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/orders", {
        items: input.items,
        shipping: input.shipping,
        billing: input.billing,
        payment: input.payment,
      });
      return response.data as Order;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to place order."
      );
    }
  }
);

export const updateOrderStatusThunk = createAsyncThunk(
  "orders/updateStatus",
  async (
    { orderId, status }: { orderId: string; status: Order["status"] },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch(
        `/api/admin/orders/${orderId}/status`,
        { status }
      );
      return response.data as Order;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update order status."
      );
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadOrdersForUserThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadOrdersForUserThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(loadOrdersForUserThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(placeOrderThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(placeOrderThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = [action.payload, ...state.orders];
        state.error = null;
      })
      .addCase(placeOrderThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateOrderStatusThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateOrderStatusThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx >= 0) {
          state.orders[idx] = action.payload;
        }
      })
      .addCase(updateOrderStatusThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default ordersSlice.reducer;
