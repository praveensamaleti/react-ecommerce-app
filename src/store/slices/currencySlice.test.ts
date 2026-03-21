import { configureStore } from "@reduxjs/toolkit";
import currencyReducer, { setCurrency } from "./currencySlice";

function makeStore() {
  return configureStore({ reducer: { currency: currencyReducer } });
}

let store: ReturnType<typeof makeStore>;

beforeEach(() => {
  store = makeStore();
});

describe("currencySlice", () => {
  it("initial state is USD", () => {
    expect(store.getState().currency.currency).toBe("USD");
  });

  it('setCurrency("EUR") sets EUR', () => {
    store.dispatch(setCurrency("EUR"));
    expect(store.getState().currency.currency).toBe("EUR");
  });

  it('setCurrency("INR") sets INR', () => {
    store.dispatch(setCurrency("INR"));
    expect(store.getState().currency.currency).toBe("INR");
  });
});
