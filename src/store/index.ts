import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import currencyReducer from "./slices/currencySlice";
import ordersReducer from "./slices/ordersSlice";
import productsReducer from "./slices/productsSlice";
import themeReducer from "./slices/themeSlice";
import { authLogoutMiddleware } from "./authLogoutMiddleware";

const rootReducer = combineReducers({
  auth: persistReducer(
    { key: "ecom_auth", storage, whitelist: ["user", "token"] },
    authReducer
  ),
  cart: persistReducer(
    { key: "ecom_cart", storage, whitelist: ["items"] },
    cartReducer
  ),
  currency: persistReducer({ key: "ecom_currency", storage }, currencyReducer),
  theme: persistReducer({ key: "ecom_theme", storage }, themeReducer),
  orders: ordersReducer,
  products: productsReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(authLogoutMiddleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
