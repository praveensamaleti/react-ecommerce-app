import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/domain";
import api from "../utils/api";
import { setStorageItem, removeStorageItem } from "../utils/storage";

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

type AuthActions = {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, "name" | "email">>) => void;
  clearError: () => void;
};

const STORAGE_KEY = "ecom_auth";

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => {
      // Listen for logout events from axios interceptor
      if (typeof window !== 'undefined') {
        window.addEventListener('auth-logout', () => {
          set({ user: null, token: null, error: null, isLoading: false });
          removeStorageItem("token");
          removeStorageItem("refreshToken");
        });
      }

      return {
        user: null,
        token: null,
        isLoading: false,
        error: null,

        clearError: () => set({ error: null }),

        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.post("/api/auth/login", { email, password });
            const { user, token, refreshToken } = response.data;
            
            setStorageItem("token", token);
            setStorageItem("refreshToken", refreshToken);
            
            set({
              isLoading: false,
              user,
              token,
              error: null
            });
            return true;
          } catch (err: any) {
            const message = err.response?.data?.message || "Invalid email or password.";
            set({ isLoading: false, error: message });
            return false;
          }
        },

        register: async (name, email, password) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.post("/api/auth/register", { name, email, password });
            const { user, token, refreshToken } = response.data;
            
            setStorageItem("token", token);
            setStorageItem("refreshToken", refreshToken);

            set({
              isLoading: false,
              user,
              token,
              error: null
            });
            return true;
          } catch (err: any) {
            const message = err.response?.data?.message || "Registration failed.";
            set({ isLoading: false, error: message });
            return false;
          }
        },

        logout: async () => {
          try {
            await api.post("/api/auth/logout");
          } catch (err) {
            console.error("Logout error:", err);
          } finally {
            set({ user: null, token: null, error: null, isLoading: false });
            removeStorageItem("token");
            removeStorageItem("refreshToken");
          }
        },

        updateProfile: (patch) => {
          const current = get().user;
          if (!current) return;
          set({ user: { ...current, ...patch } });
        }
      };
    },
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ user: s.user, token: s.token })
    }
  )
);
