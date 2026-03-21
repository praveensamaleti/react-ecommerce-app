import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../types/domain";
import api from "../../utils/api";
import { setStorageItem, removeStorageItem } from "../../utils/storage";

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const { user, token, refreshToken } = response.data;
      setStorageItem("token", token);
      setStorageItem("refreshToken", refreshToken);
      return { user, token, refreshToken } as {
        user: User;
        token: string;
        refreshToken: string;
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Invalid email or password."
      );
    }
  }
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (
    {
      name,
      email,
      password,
    }: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });
      const { user, token, refreshToken } = response.data;
      setStorageItem("token", token);
      setStorageItem("refreshToken", refreshToken);
      return { user, token, refreshToken } as {
        user: User;
        token: string;
        refreshToken: string;
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed."
      );
    }
  }
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  try {
    await api.post("/api/auth/logout");
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    removeStorageItem("token");
    removeStorageItem("refreshToken");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    forceLogout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      state.isLoading = false;
    },
    updateProfile(
      state,
      action: PayloadAction<Partial<Pick<User, "name" | "email">>>
    ) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
        state.isLoading = false;
      });
  },
});

export const { clearError, forceLogout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
