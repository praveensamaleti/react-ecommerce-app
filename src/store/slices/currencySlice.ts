import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CurrencyCode } from "../../utils/money";

type CurrencyState = {
  currency: CurrencyCode;
};

const initialState: CurrencyState = {
  currency: "USD",
};

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    setCurrency(state, action: PayloadAction<CurrencyCode>) {
      state.currency = action.payload;
    },
  },
});

export const { setCurrency } = currencySlice.actions;
export default currencySlice.reducer;
