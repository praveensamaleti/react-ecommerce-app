import React from "react";
import { Button, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ProductCard } from "../components/ProductCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { QuickViewModal } from "../components/QuickViewModal";
import { LinkButton } from "../components/LinkButton";
import type { Product } from "../types/domain";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadProductsThunk } from "../store/slices/productsSlice";
import { addToCartThunk, removeFromCartThunk, setQtyThunk } from "../store/slices/cartSlice";
import { useCartAutoTotals } from "../hooks/useCartAutoTotals";

export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((s) => s.products.products);
  const isLoading = useAppSelector((s) => s.products.isLoading);
  const error = useAppSelector((s) => s.products.error);
  const cartItems = useAppSelector((s) => s.cart.items);
  useCartAutoTotals();

  const cartMap = React.useMemo(
    () => new Map(cartItems.map((i) => [i.productId, i.qty])),
    [cartItems]
  );

  const [quick, setQuick] = React.useState<Product | null>(null);
  const [showQuick, setShowQuick] = React.useState(false);

  React.useEffect(() => {
    if (products.length === 0) dispatch(loadProductsThunk());
  }, [products.length, dispatch]);

  const featured = products.filter((p) => p.featured).slice(0, 8);

  const onAdd = (productId: string, qty = 1) => {
    dispatch(addToCartThunk({ productId, qty }));
    toast.success("Added to cart.");
  };

  const onRemove = (productId: string) => {
    dispatch(removeFromCartThunk({ productId }));
  };

  const onQty = (productId: string, qty: number) => {
    dispatch(setQtyThunk({ productId, qty }));
  };

  const onQuick = (p: Product) => {
    setQuick(p);
    setShowQuick(true);
  };

  return (
    <div>
      <section className="hero-section rounded-3 shadow-sm">
        <Row className="align-items-center g-4">
          <Col md={7}>
            <h1>Your One-Stop Online Store</h1>
            <p className="mb-4">
              Discover modern essentials in Electronics and Clothing. Powered by
              a live backend—data served from PostgreSQL with Redis caching.
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <LinkButton to="/products" variant="light">
                Browse Products
              </LinkButton>
              <LinkButton to="/cart" variant="outline-light">
                View Cart
              </LinkButton>
            </div>
          </Col>
          <Col md={5}>
            <div className="bg-white bg-opacity-10 rounded-3 p-4">
              <div className="fw-semibold">Fast highlights</div>
              <ul className="mt-3 mb-0">
                <li>Search + filters + pagination</li>
                <li>Redux Toolkit global state (cart/auth/products/orders)</li>
                <li>Live data from PostgreSQL + Redis cache</li>
              </ul>
            </div>
          </Col>
        </Row>
      </section>

      <div className="d-flex align-items-center justify-content-between mt-4">
        <h2 className="h4 m-0">Featured products</h2>
        <LinkButton to="/products" variant="outline-primary" size="sm">
          View all
        </LinkButton>
      </div>

      {isLoading ? <LoadingSpinner label="Loading products..." /> : null}
      {error ? <div className="alert alert-danger mt-3">{error}</div> : null}

      {!isLoading && !error ? (
        <Row className="g-3 mt-1">
          {featured.map((p) => (
            <Col key={p.id} xs={12} sm={6} md={4} lg={3}>
              <ProductCard
                product={p}
                cartQty={cartMap.get(p.id) ?? 0}
                onAddToCart={(id) => onAdd(id)}
                onRemoveFromCart={onRemove}
                onQtyChange={onQty}
                onQuickView={onQuick}
              />
            </Col>
          ))}
        </Row>
      ) : null}

      <QuickViewModal
        product={quick}
        show={showQuick}
        onHide={() => setShowQuick(false)}
        onAddToCart={(id, qty) => {
          onAdd(id, qty);
          setShowQuick(false);
        }}
      />
    </div>
  );
};
