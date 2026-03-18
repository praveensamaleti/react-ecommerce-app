# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm start          # Dev server at http://localhost:3000
npm run build      # Production build to /build
npm test           # Run Jest tests (no test files exist yet)

# Docker local testing
docker-compose up --build   # Production container at http://localhost:80
```

There is no configured lint command. TypeScript strict mode (`tsconfig.json`) is the primary static analysis layer.

## Architecture

**Stack**: React 18, TypeScript (strict), Zustand, React Router v6, React Bootstrap, Lucide React, React Hook Form, Axios.

**Backend**: All store actions call a real REST API. The base URL is set via `REACT_APP_API_URL` in `.env` (currently points to a live AWS ALB). The app requires a running backend — there is no offline/mock mode wired into the stores. `src/data/mocks.ts` and `src/utils/mockApi.ts` exist as reference data, not active client-side stubs.

## State Management (Zustand)

Four stores in `src/stores/`:

- **`authStore`** — user session, JWT token. Persisted to localStorage (`ecom_auth`). Listens for `"auth-logout"` CustomEvent dispatched by the Axios interceptor on 401/refresh failure.
- **`cartStore`** — cart items and totals. Items are persisted (`ecom_cart`); totals are **not** persisted and must be recomputed at runtime by calling `recomputeTotals(products)`.
- **`productsStore`** — product list with server-side filtering/pagination. All filter setters (`setQuery`, `setCategory`, etc.) immediately trigger `loadProducts()`. Handles admin CRUD too.
- **`ordersStore`** — order list and placement. Not persisted.

## Cart Totals Pattern

Cart totals are intentionally not stored to avoid stale price data. The `useCartAutoTotals` hook (in `src/hooks/`) bridges `cartStore` items with `productsStore` products and calls `recomputeTotals` via `useEffect`. **Any page that displays cart totals must call this hook** — currently: HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage.

## Routing & Auth Guards

Routes are defined in `src/App.tsx` using React Router v6. `RequireAuth` and `RequireAdmin` are inline guard components in `App.tsx` that read from `useAuthStore` and render `<Navigate replace>` when access is denied. Admin role check: `user.role === "admin"`.

## API Layer

`src/utils/api.ts` exports an Axios instance with:
- Request interceptor: attaches `Authorization: Bearer <token>` from localStorage
- Response interceptor: on 401, attempts token refresh via `POST /api/auth/refresh` with a queue to prevent parallel refresh calls. On failure, dispatches `"auth-logout"` CustomEvent.

## Component Conventions

- `src/pages/` — route-level components that own page logic and call store actions directly.
- `src/components/` — presentational components that receive props and emit callbacks. Exception: `AppNavbar` reads `authStore` and `cartStore` directly for global display.
- All forms use `react-hook-form` with inline error rendering. No Zod/Yup schema validation.
- `src/types/domain.ts` is the single source of truth for all TypeScript domain types.
- `LinkButton` component reconciles React Router `<Link>` with Bootstrap button classes.

## Deployment

CI/CD: `.github/workflows/deploy.yml` — triggers on push to `main`. Builds Docker image → pushes to AWS ECR (`react-ecommerce-app`) → updates ECS task definition → deploys to ECS service `react-ecommerce-service` in `ap-southeast-2`. Requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` repository secrets.
