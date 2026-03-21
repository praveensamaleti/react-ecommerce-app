import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrencyCode } from "../utils/money";

type CurrencyState = { currency: CurrencyCode };
type CurrencyActions = { setCurrency: (c: CurrencyCode) => void };

export const useCurrencyStore = create<CurrencyState & CurrencyActions>()(
  persist(
    (set) => ({ currency: "USD", setCurrency: (currency) => set({ currency }) }),
    { name: "ecom_currency" }
  )
);
