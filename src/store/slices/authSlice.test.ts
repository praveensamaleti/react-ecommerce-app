import { configureStore } from "@reduxjs/toolkit";
import authReducer, {
  clearError,
  forceLogout,
  updateProfile,
  loginThunk,
  registerThunk,
  logoutThunk,
} from "./authSlice";
import { authLogoutMiddleware } from "../authLogoutMiddleware";
import api from "../../utils/api";

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockUser = {
  id: "u1",
  name: "Alice",
  email: "alice@test.com",
  role: "user" as const,
};

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

function makeStoreWithMiddleware() {
  return configureStore({
    reducer: { auth: authReducer },
    middleware: (gDM) => gDM().concat(authLogoutMiddleware),
  });
}

let store: ReturnType<typeof makeStore>;

beforeEach(() => {
  store = makeStore();
  localStorage.clear();
  jest.clearAllMocks();
});

describe("initial state", () => {
  it("has null user, token, not loading, no error", () => {
    const s = store.getState().auth;
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });
});

describe("login", () => {
  it("success sets user and token", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { user: mockUser, token: "tok1", refreshToken: "ref1" },
    });

    await store.dispatch(loginThunk({ email: "alice@test.com", password: "pass" }));

    const s = store.getState().auth;
    expect(s.user).toEqual(mockUser);
    expect(s.token).toBe("tok1");
    expect(s.error).toBeNull();
  });

  it("success stores token in localStorage", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { user: mockUser, token: "tok1", refreshToken: "ref1" },
    });

    await store.dispatch(loginThunk({ email: "alice@test.com", password: "pass" }));

    expect(localStorage.getItem("token")).toBe("tok1");
  });

  it("failure sets error", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } },
    });

    await store.dispatch(loginThunk({ email: "bad@test.com", password: "wrong" }));

    const s = store.getState().auth;
    expect(s.error).toBe("Invalid credentials");
    expect(s.user).toBeNull();
  });

  it("failure uses fallback message when no response data", async () => {
    mockApi.post.mockRejectedValueOnce(new Error("Network error"));

    const result = await store.dispatch(
      loginThunk({ email: "bad@test.com", password: "wrong" })
    );

    expect(loginThunk.rejected.match(result)).toBe(true);
    expect(store.getState().auth.error).toBe("Invalid email or password.");
  });

  it("loginThunk.fulfilled.match returns true on success", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { user: mockUser, token: "tok1", refreshToken: "ref1" },
    });

    const result = await store.dispatch(
      loginThunk({ email: "alice@test.com", password: "pass" })
    );

    expect(loginThunk.fulfilled.match(result)).toBe(true);
  });
});

describe("register", () => {
  it("success sets user and token", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { user: mockUser, token: "tok2", refreshToken: "ref2" },
    });

    await store.dispatch(
      registerThunk({ name: "Alice", email: "alice@test.com", password: "pass123" })
    );

    expect(store.getState().auth.user).toEqual(mockUser);
  });

  it("failure sets error", async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { message: "Email taken" } },
    });

    await store.dispatch(
      registerThunk({ name: "Bob", email: "bob@test.com", password: "pass123" })
    );

    expect(store.getState().auth.error).toBe("Email taken");
  });

  it("failure uses fallback message", async () => {
    mockApi.post.mockRejectedValueOnce(new Error("Server error"));

    await store.dispatch(
      registerThunk({ name: "Bob", email: "bob@test.com", password: "pass123" })
    );

    expect(store.getState().auth.error).toBe("Registration failed.");
  });
});

describe("logout", () => {
  it("clears user and token", async () => {
    // Set user first
    mockApi.post.mockResolvedValueOnce({
      data: { user: mockUser, token: "tok1", refreshToken: "ref1" },
    });
    await store.dispatch(loginThunk({ email: "alice@test.com", password: "pass" }));

    mockApi.post.mockResolvedValueOnce({});
    await store.dispatch(logoutThunk());

    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.token).toBeNull();
  });

  it("still clears state even when api throws", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { user: mockUser, token: "tok1", refreshToken: "ref1" },
    });
    await store.dispatch(loginThunk({ email: "alice@test.com", password: "pass" }));

    mockApi.post.mockRejectedValueOnce(new Error("Network"));
    await store.dispatch(logoutThunk());

    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.token).toBeNull();
  });

  it("removes token from localStorage", async () => {
    localStorage.setItem("token", "tok1");
    mockApi.post.mockResolvedValueOnce({});

    await store.dispatch(logoutThunk());

    expect(localStorage.getItem("token")).toBeNull();
  });
});

describe("updateProfile", () => {
  it("patches user name", () => {
    mockApi.post.mockResolvedValueOnce({
      data: { user: mockUser, token: "tok1", refreshToken: "ref1" },
    });
    store.dispatch({
      type: "auth/login/fulfilled",
      payload: { user: mockUser, token: "tok1", refreshToken: "ref1" },
    });
    store.dispatch(updateProfile({ name: "Alice Updated" }));
    expect(store.getState().auth.user?.name).toBe("Alice Updated");
  });

  it("is a no-op when user is null", () => {
    expect(() => store.dispatch(updateProfile({ name: "X" }))).not.toThrow();
    expect(store.getState().auth.user).toBeNull();
  });
});

describe("clearError", () => {
  it("sets error to null", () => {
    store.dispatch({ type: "auth/login/rejected", payload: "some error" });
    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
  });
});

describe("auth-logout CustomEvent", () => {
  it("clears user when auth-logout event fires", () => {
    const s = makeStoreWithMiddleware();
    s.dispatch({
      type: "auth/login/fulfilled",
      payload: { user: mockUser, token: "tok1", refreshToken: "" },
    });
    expect(s.getState().auth.user).toEqual(mockUser);

    window.dispatchEvent(new CustomEvent("auth-logout"));

    expect(s.getState().auth.user).toBeNull();
    expect(s.getState().auth.token).toBeNull();
  });
});
