import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppNavbar } from "./AppNavbar";
import { useAppDispatch, useAppSelector } from "../store/hooks";

jest.mock("../store/hooks", () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

const mockDispatch = jest.fn().mockResolvedValue(undefined);

const makeState = (user: any, itemCount = 0) => {
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      auth: { user },
      cart: { totals: { itemCount } },
      theme: { theme: "light" },
      currency: { currency: "USD" },
    })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockResolvedValue(undefined);
  makeState(null);
});

const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("AppNavbar — logged out", () => {
  beforeEach(() => makeState(null));

  it("shows Login link", () => {
    wrap(<AppNavbar />);
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
  });

  it("shows Register link", () => {
    wrap(<AppNavbar />);
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
  });

  it("does not show user dropdown", () => {
    wrap(<AppNavbar />);
    expect(screen.queryByText(/logout/i)).toBeNull();
  });
});

describe("AppNavbar — logged in as user", () => {
  const user = { id: "u1", name: "Alice", email: "a@a.com", role: "user" as const };

  beforeEach(() => makeState(user));

  it("shows user name", () => {
    wrap(<AppNavbar />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("does not show Admin link for non-admin", () => {
    wrap(<AppNavbar />);
    expect(screen.queryByText("Admin")).toBeNull();
  });
});

describe("AppNavbar — logged in as admin", () => {
  const admin = { id: "u2", name: "Bob", email: "b@b.com", role: "admin" as const };

  beforeEach(() => makeState(admin));

  it("shows Admin link", async () => {
    wrap(<AppNavbar />);
    fireEvent.click(screen.getByRole("button", { name: /bob/i }));
    expect(await screen.findByText("Admin")).toBeInTheDocument();
  });
});

describe("AppNavbar — cart badge", () => {
  beforeEach(() => makeState(null));

  it("shows item count in badge", () => {
    makeState(null, 3);
    wrap(<AppNavbar />);
    expect(screen.getByLabelText("3 items in cart")).toBeInTheDocument();
  });

  it("shows 0 when cart is empty", () => {
    makeState(null, 0);
    wrap(<AppNavbar />);
    expect(screen.getByLabelText("0 items in cart")).toBeInTheDocument();
  });
});

describe("AppNavbar — logout", () => {
  const user = { id: "u1", name: "Alice", email: "a@a.com", role: "user" as const };

  beforeEach(() => makeState(user));

  it("clicking Logout item dispatches logoutThunk", async () => {
    wrap(<AppNavbar />);
    fireEvent.click(screen.getByRole("button", { name: /alice/i }));
    const logoutItem = await screen.findByText(/logout/i);
    fireEvent.click(logoutItem);
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });
});

describe("AppNavbar — theme toggle", () => {
  beforeEach(() => makeState(null));

  it("shows theme toggle button", () => {
    wrap(<AppNavbar />);
    expect(screen.getByRole("button", { name: /switch to dark mode/i })).toBeInTheDocument();
  });
});

describe("AppNavbar — currency selector", () => {
  beforeEach(() => makeState(null));

  it("shows currency selector", () => {
    wrap(<AppNavbar />);
    expect(screen.getByRole("combobox", { name: /select currency/i })).toBeInTheDocument();
  });
});
