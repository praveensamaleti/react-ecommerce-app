import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession, User } from "../types/domain";
import { withDelay } from "../utils/mockApi";
import { mockUsers } from "../data/mocks";

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

type AuthActions = {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "email">>) => void;
  clearError: () => void;
};

const STORAGE_KEY = "ecom_auth";

function buildSession(user: User): AuthSession {
  return {
    user,
    token: `mock-token-${user.id}-${Date.now()}`
  };
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        const res = await withDelay(() => {
          const found = mockUsers.find(
            (u) => u.email.toLowerCase() === email.toLowerCase()
          );
          if (!found || found.password !== password) {
            throw new Error("Invalid email or password.");
          }
          const { password: _pw, ...user } = found;
          return buildSession(user);
        }, 650);

        if (!res.ok) {
          set({ isLoading: false, error: res.error });
          return false;
        }

        set({
          isLoading: false,
          user: res.data.user,
          token: res.data.token
        });
        return true;
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        const res = await withDelay(() => {
          const exists = mockUsers.some(
            (u) => u.email.toLowerCase() === email.toLowerCase()
          );
          if (exists) throw new Error("Email is already registered.");
          if (password.length < 8)
            throw new Error("Password must be at least 8 characters.");

          const newUser: User & { password: string } = {
            id: `u${Math.floor(Math.random() * 9000) + 1000}`,
            name,
            email,
            role: "user",
            password
          };
          mockUsers.push(newUser);
          const { password: _pw, ...user } = newUser;
          return buildSession(user);
        }, 900);

        if (!res.ok) {
          set({ isLoading: false, error: res.error });
          return false;
        }

        set({
          isLoading: false,
          user: res.data.user,
          token: res.data.token
        });
        return true;
      },

      logout: () => {
        set({ user: null, token: null, error: null, isLoading: false });
      },

      updateProfile: (patch) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...patch } });
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ user: s.user, token: s.token })
    }
  )
);

