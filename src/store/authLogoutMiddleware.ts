import type { Middleware } from "@reduxjs/toolkit";
import { forceLogout } from "./slices/authSlice";

export const authLogoutMiddleware: Middleware = (storeAPI) => {
  if (typeof window !== "undefined") {
    window.addEventListener("auth-logout", () => {
      storeAPI.dispatch(forceLogout());
    });
  }
  return (next) => (action) => next(action);
};
