import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";
import { useAppDispatch, useAppSelector } from "../store/hooks";

jest.mock("../store/hooks", () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

const mockDispatch = jest.fn();

const setupStore = (theme: "light" | "dark") => {
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({ theme: { theme } })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  setupStore("light");
});

describe("ThemeToggle", () => {
  it("renders Moon icon in light mode", () => {
    setupStore("light");
    render(<ThemeToggle />);
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

  it("clicking button dispatches toggleTheme", () => {
    setupStore("light");
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
