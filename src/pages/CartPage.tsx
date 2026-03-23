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
import { removeFromCart, setQty } from "../store/slices/cartSlice";
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
        <h1 className="h3 mb-3">Cart</h1>
        {hasOutOfStockItems && (
          <Alert variant="warning" className="mb-3">
            ⚠️ Some items in your cart are out of stock or have insufficient inventory. Please update quantities before checkout.
          </Alert>
        )}
        <div className="rounded-3 shadow-sm p-3 bg-body-tertiary">
          {hydrated.map(({ it, p }) => (
            <CartItemRow
              key={p.id}
              product={p}
              qty={it.qty}
              outOfStock={p.stock === 0}
              insufficientStock={p.stock > 0 && p.stock < it.qty}
              availableStock={p.stock}
              onQtyChange={(q) => dispatch(setQty({ productId: p.id, qty: q }))}
              onRemove={() => {
                dispatch(removeFromCart(p.id));
                toast.info("Removed from cart.");
              }}
            />
          ))}
        </div>
      </Col>
      <Col lg={4}>
        <Card className="shadow-sm">
          <Card.Body>
            <Card.Title>Order summary</Card.Title>
            <div className="d-flex justify-content-between mt-3">
              <span className="text-muted">Subtotal</span>
              <span>{fmt(totals.subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span className="text-muted">Discount (10%)</span>
              <span>-{fmt(totals.discount)}</span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span className="text-muted">Tax</span>
              <span>{fmt(totals.tax)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-semibold">
              <span>Total</span>
              <span>{fmt(totals.total)}</span>
            </div>
            <div className="d-grid gap-2 mt-3">
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
