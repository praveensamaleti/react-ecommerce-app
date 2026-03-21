import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";
import { useThemeStore } from "../stores/themeStore";

jest.mock("../stores/themeStore");

const mockToggleTheme = jest.fn();

const setupStore = (theme: "light" | "dark") => {
  (useThemeStore as jest.Mock).mockReturnValue({ theme, toggleTheme: mockToggleTheme });
};

beforeEach(() => {
  jest.clearAllMocks();
  setupStore("light");
});

describe("ThemeToggle", () => {
  it("renders Moon icon in light mode", () => {
    setupStore("light");
    render(<ThemeToggle />);
    // Moon icon is rendered as an SVG; button label indicates dark mode is the target
    expect(screen.getByRole("button", { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it("renders Sun icon in dark mode", () => {
    setupStore("dark");
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it("aria-label says 'Switch to dark mode' in light mode", () => {
    setupStore("light");
    render(<ThemeToggle />);
    expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument();
  });

  it("clicking button calls toggleTheme", () => {
    setupStore("light");
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});
