import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Button,
  Carousel,
  Form,
  Badge,
  Table
} from "react-bootstrap";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { RatingStars } from "../components/RatingStars";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadProductsThunk } from "../store/slices/productsSlice";
import { addToCart } from "../store/slices/cartSlice";
import { useCurrencyFormatter } from "../hooks/useCurrencyFormatter";
import { useCartAutoTotals } from "../hooks/useCartAutoTotals";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const products = useAppSelector((s) => s.products.products);
  const isLoading = useAppSelector((s) => s.products.isLoading);
  const error = useAppSelector((s) => s.products.error);
  const fmt = useCurrencyFormatter();
  useCartAutoTotals();

  const [qty, setQty] = React.useState(1);

  React.useEffect(() => {
    if (products.length === 0) dispatch(loadProductsThunk());
  }, [products.length, dispatch]);

  const product = products.find((p) => p.id === id);

  React.useEffect(() => {
    setQty(1);
  }, [product?.id]);

  if (isLoading && products.length === 0) return <LoadingSpinner label="Loading product..." />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        description="The product may have been removed."
        actionLabel="Back to products"
        onAction={() => navigate("/products")}
      />
    );
  }

  const maxQty = Math.max(1, Math.min(99, product.stock || 1));

  const onAdd = () => {
    const nextQty = Math.min(maxQty, Math.max(1, qty));
    dispatch(addToCart({ productId: product.id, qty: nextQty }));
    toast.success("Added to cart.");
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <div className="text-muted small">
            <Link to="/products">Products</Link> / {product.category}
          </div>
          <h1 className="h3 m-0">{product.name}</h1>
        </div>
        {product.stock > 0 ? (
          <Badge bg="success">In stock</Badge>
        ) : (
          <Badge bg="secondary">Out of stock</Badge>
        )}
      </div>

      <Row className="g-4">
        <Col lg={6}>
          <div className="bg-body-tertiary rounded-3 shadow-sm p-2">
            <Carousel interval={null} aria-label="Product images">
              {product.images.map((src, idx) => (
                <Carousel.Item key={`${product.id}-${idx}`}>
                  <img
                    src={src}
                    alt={`${product.name} image ${idx + 1}`}
                    className="d-block w-100 rounded"
                    style={{ height: 420, objectFit: "cover" }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          </div>
        </Col>

        <Col lg={6}>
          <div className="bg-body-tertiary rounded-3 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <div className="h4 text-primary mb-1">
                  {fmt(product.price)}
                </div>
                <RatingStars
                  rating={product.rating}
                  count={product.ratingCount}
                />
              </div>
              <div className="text-end">
                <div className="small text-muted">Stock</div>
                <div className="fw-semibold">{product.stock}</div>
              </div>
            </div>

            <p className="text-muted mt-3 mb-3">{product.description}</p>

            <Row className="g-2 align-items-end">
              <Col xs={6} sm={4}>
                <Form.Group controlId="detailQty">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={maxQty}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    aria-label="Quantity"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={8}>
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={onAdd}
                  disabled={product.stock <= 0}
                  aria-label="Add to cart"
                >
                  Add to cart
                </Button>
              </Col>
            </Row>

            <hr className="my-4" />

            <div className="fw-semibold mb-2">Specs</div>
            <Table responsive size="sm" className="mb-0" aria-label="Specifications table">
              <tbody>
                {Object.entries(product.specs).map(([k, v]) => (
                  <tr key={k}>
                    <td className="text-muted" style={{ width: 160 }}>
                      {k}
                    </td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>

      <div className="bg-body-tertiary rounded-3 shadow-sm p-4 mt-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="h5 m-0">Reviews</h2>
          <div className="small text-muted">{product.reviews.length} total</div>
        </div>
        {product.reviews.length === 0 ? (
          <div className="text-muted mt-3">No reviews yet.</div>
        ) : (
          <div className="mt-3 d-flex flex-column gap-3">
            {product.reviews.map((r) => (
              <div key={r.id} className="border rounded-3 p-3">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <div className="fw-semibold">{r.title}</div>
                    <div className="small text-muted">{r.userName}</div>
                  </div>
                  <RatingStars rating={r.rating} ariaLabel={`Review rating ${r.rating} out of 5`} />
                </div>
                <div className="mt-2">{r.body}</div>
                <div className="small text-muted mt-2">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
