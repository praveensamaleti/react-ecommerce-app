import React from "react";
import { Button, Col, Row, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { CartItemRow } from "../components/CartItemRow";
import { LinkButton } from "../components/LinkButton";
import { formatMoney } from "../utils/money";
import { useCartStore } from "../stores/cartStore";
import { useProductsStore } from "../stores/productsStore";
import { useCartAutoTotals } from "../hooks/useCartAutoTotals";

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const setQty = useCartStore((s) => s.setQty);

  const { products, isLoading, error, loadProducts } = useProductsStore();
  useCartAutoTotals();

  React.useEffect(() => {
    if (products.length === 0) loadProducts();
  }, [products.length, loadProducts]);

  if (isLoading && products.length === 0) return <LoadingSpinner label="Loading cart..." />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const productMap = new Map(products.map((p) => [p.id, p] as const));
  const hydrated = items
    .map((it) => ({ it, p: productMap.get(it.productId) }))
    .filter((x): x is { it: typeof items[number]; p: NonNullable<(typeof x)["p"]> } => Boolean(x.p));

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
        <div className="rounded-3 shadow-sm p-3 bg-body-tertiary">
          {hydrated.map(({ it, p }) => (
            <CartItemRow
              key={p.id}
              product={p}
              qty={it.qty}
              onQtyChange={(q) => setQty(p.id, q)}
              onRemove={() => {
                removeFromCart(p.id);
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
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span className="text-muted">Discount (10%)</span>
              <span>-{formatMoney(totals.discount)}</span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span className="text-muted">Tax</span>
              <span>{formatMoney(totals.tax)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-semibold">
              <span>Total</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
            <div className="d-grid gap-2 mt-3">
              <LinkButton to="/checkout" variant="primary">
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

