import { useThemeStore } from "./themeStore";

beforeEach(() => {
  useThemeStore.setState({ theme: "light" });
});

describe("themeStore", () => {
  it("initial state is light", () => {
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("toggleTheme switches light → dark", () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggleTheme switches dark → light", () => {
    useThemeStore.setState({ theme: "dark" });
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("setTheme('dark') sets dark", () => {
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("setTheme('light') sets light", () => {
    useThemeStore.setState({ theme: "dark" });
    useThemeStore.getState().setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");
  });
});
