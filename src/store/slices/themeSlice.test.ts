import { configureStore } from "@reduxjs/toolkit";
import themeReducer, { setTheme, toggleTheme } from "./themeSlice";

function makeStore() {
  return configureStore({ reducer: { theme: themeReducer } });
}

let store: ReturnType<typeof makeStore>;

beforeEach(() => {
  store = makeStore();
});

describe("themeSlice", () => {
  it("initial state is light", () => {
    expect(store.getState().theme.theme).toBe("light");
  });

  it("toggleTheme switches light → dark", () => {
    store.dispatch(toggleTheme());
    expect(store.getState().theme.theme).toBe("dark");
  });

  it("toggleTheme switches dark → light", () => {
    store.dispatch(setTheme("dark"));
    store.dispatch(toggleTheme());
    expect(store.getState().theme.theme).toBe("light");
  });

  it("setTheme('dark') sets dark", () => {
    store.dispatch(setTheme("dark"));
    expect(store.getState().theme.theme).toBe("dark");
  });

  it("setTheme('light') sets light", () => {
    store.dispatch(setTheme("dark"));
    store.dispatch(setTheme("light"));
    expect(store.getState().theme.theme).toBe("light");
  });
});
