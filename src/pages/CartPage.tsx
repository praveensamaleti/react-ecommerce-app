import React from "react";
import { Alert, Badge, Col, Row, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { CartItemRow } from "../components/CartItemRow";
import { LinkButton } from "../components/LinkButton";
import { useCurrencyFormatter } from "../hooks/useCurrencyFormatter";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { removeFromCartThunk, setQtyThunk } from "../store/slices/cartSlice";
import { loadProductsThunk } from "../store/slices/productsSlice";
import { useCartAutoTotals } from "../hooks/useCartAutoTotals";

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const totals = useAppSelector((s) => s.cart.totals);
  const products = useAppSelector((s) => s.products.products);
  const isLoading = useAppSelector((s) => s.products.isLoading);
  const error = useAppSelector((s) => s.products.error);
  const fmt = useCurrencyFormatter();
  useCartAutoTotals();

  React.useEffect(() => {
    if (products.length === 0) dispatch(loadProductsThunk());
  }, [products.length, dispatch]);

  if (isLoading && products.length === 0) return <LoadingSpinner label="Loading cart..." />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const productMap = new Map(products.map((p) => [p.id, p] as const));
  const hydrated = items
    .map((it) => ({ it, p: productMap.get(it.productId) }))
    .filter((x): x is { it: typeof items[number]; p: NonNullable<(typeof x)["p"]> } => Boolean(x.p));

  const hasOutOfStockItems = hydrated.some(
    ({ it, p }) => p.stock === 0 || p.stock < it.qty
  );

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add a few items to get started."
        actionLabel="Browse products"
        onAction={() => navigate("/products")}
      />
    );
  }

  return (
    <Row className="g-4">
      <Col lg={8}>
        <h1 className="h3 mb-3 page-title">Cart</h1>
        {hasOutOfStockItems && (
          <Alert variant="warning" className="mb-3" style={{ borderRadius: 12, fontSize: "0.9rem" }}>
            Some items in your cart are out of stock or have insufficient inventory. Please update quantities before checkout.
          </Alert>
        )}
        <div className="cart-items-panel">
          {hydrated.map(({ it, p }) => (
            <CartItemRow
              key={p.id}
              product={p}
              qty={it.qty}
              outOfStock={p.stock === 0}
              insufficientStock={p.stock > 0 && p.stock < it.qty}
              availableStock={p.stock}
              onQtyChange={(q) => dispatch(setQtyThunk({ productId: p.id, qty: q }))}
              onRemove={() => {
                dispatch(removeFromCartThunk({ productId: p.id, variantId: it.variantId }));
                toast.info("Removed from cart.");
              }}
            />
          ))}
        </div>
      </Col>
      <Col lg={4}>
        <Card className="order-summary-card shadow-sm">
          <Card.Body className="p-4">
            <h5 className="fw-bold mb-4" style={{ letterSpacing: "-0.02em" }}>Order summary</h5>
            <div className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: "var(--ec-card-border)" }}>
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>Subtotal</span>
              <span className="fw-semibold">{fmt(totals.subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: "var(--ec-card-border)", color: "#10b981" }}>
              <span style={{ fontSize: "0.9rem" }}>Discount (10%)</span>
              <span className="fw-semibold">-{fmt(totals.discount)}</span>
            </div>
            <div className="d-flex justify-content-between py-2" style={{ borderColor: "var(--ec-card-border)" }}>
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>Tax</span>
              <span className="fw-semibold">{fmt(totals.tax)}</span>
            </div>
            <hr style={{ borderColor: "var(--ec-card-border)", margin: "0.75rem 0" }} />
            <div className="d-flex justify-content-between align-items-center mb-4">
              <span className="fw-bold" style={{ fontSize: "1rem" }}>Total</span>
              <span className="fw-bold" style={{ fontSize: "1.3rem", color: "var(--ec-primary)" }}>
                {fmt(totals.total)}
              </span>
            </div>
            <div className="d-grid gap-2">
              <LinkButton to="/checkout" variant="primary" disabled={hasOutOfStockItems}>
                Proceed to checkout
              </LinkButton>
              <LinkButton to="/products" variant="outline-primary">
                Continue shopping
              </LinkButton>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};
