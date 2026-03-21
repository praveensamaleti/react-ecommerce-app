import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencySelector } from "./CurrencySelector";
import { useAppDispatch, useAppSelector } from "../store/hooks";

jest.mock("../store/hooks", () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

const mockDispatch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({ currency: { currency: "USD" } })
  );
});

describe("CurrencySelector", () => {
  it("renders all 5 currency options", () => {
    render(<CurrencySelector />);
    const select = screen.getByRole("combobox", { name: /select currency/i });
    expect(select.querySelectorAll("option")).toHaveLength(5);
    expect(screen.getByText("$ USD")).toBeInTheDocument();
    expect(screen.getByText("€ EUR")).toBeInTheDocument();
    expect(screen.getByText("£ GBP")).toBeInTheDocument();
    expect(screen.getByText("₹ INR")).toBeInTheDocument();
    expect(screen.getByText("¥ JPY")).toBeInTheDocument();
  });

  it("selected value matches store currency (USD by default)", () => {
    render(<CurrencySelector />);
    const select = screen.getByRole("combobox", { name: /select currency/i }) as HTMLSelectElement;
    expect(select.value).toBe("USD");
  });

  it("changing the select dispatches setCurrency with the new code", () => {
    render(<CurrencySelector />);
    const select = screen.getByRole("combobox", { name: /select currency/i });
    fireEvent.change(select, { target: { value: "EUR" } });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
