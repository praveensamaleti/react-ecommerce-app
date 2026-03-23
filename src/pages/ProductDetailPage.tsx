import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Button,
  Carousel,
  Form,
  Badge,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { RatingStars } from "../components/RatingStars";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadProductsThunk } from "../store/slices/productsSlice";
import { addToCartThunk } from "../store/slices/cartSlice";
import { useCurrencyFormatter } from "../hooks/useCurrencyFormatter";
import { useCartAutoTotals } from "../hooks/useCartAutoTotals";
import type { ProductVariant } from "../types/domain";

// ------------------------------------------------------------------
// Variant selector helpers
// ------------------------------------------------------------------

/** Returns the sorted unique values for a given attribute key across all variants. */
function uniqueAttrValues(variants: ProductVariant[], key: string): string[] {
  const seen = new Set<string>();
  variants.forEach((v) => {
    const val = v.attributes[key];
    if (val) seen.add(val);
  });
  return Array.from(seen).sort();
}

/** Returns all attribute keys present across all variants, in consistent order. */
function allAttrKeys(variants: ProductVariant[]): string[] {
  const keys = new Set<string>();
  variants.forEach((v) => Object.keys(v.attributes).forEach((k) => keys.add(k)));
  return Array.from(keys);
}

/**
 * Finds the variant that exactly matches the selected attribute map.
 * Returns undefined when the selection is incomplete or no match found.
 */
function matchVariant(
  variants: ProductVariant[],
  selected: Record<string, string>
): ProductVariant | undefined {
  const keys = allAttrKeys(variants);
  if (keys.some((k) => !selected[k])) return undefined; // selection incomplete
  return variants.find((v) =>
    keys.every((k) => v.attributes[k] === selected[k])
  );
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

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
  const [selectedAttrs, setSelectedAttrs] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (products.length === 0) dispatch(loadProductsThunk());
  }, [products.length, dispatch]);

  const product = products.find((p) => p.id === id);

  // Reset variant selection when navigating to a different product
  React.useEffect(() => {
    setQty(1);
    setSelectedAttrs({});
  }, [product?.id]);

  if (isLoading && products.length === 0)
    return <LoadingSpinner label="Loading product..." />;
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

  const hasVariants = product.variants && product.variants.length > 0;
  const attrKeys = hasVariants ? allAttrKeys(product.variants) : [];
  const selectedVariant = hasVariants ? matchVariant(product.variants, selectedAttrs) : undefined;

  const effectivePrice = selectedVariant?.price != null
    ? selectedVariant.price
    : product.price;

  const effectiveStock = selectedVariant != null
    ? selectedVariant.stock
    : product.stock;

  const maxQty = Math.max(1, Math.min(99, effectiveStock || 1));
  const isOutOfStock = effectiveStock <= 0;
  const variantRequired = hasVariants && !selectedVariant;

  const toggleAttr = (key: string, value: string) => {
    setSelectedAttrs((prev) => ({
      ...prev,
      [key]: prev[key] === value ? "" : value,
    }));
    setQty(1);
  };

  const onAdd = () => {
    if (variantRequired) {
      toast.warn("Please select all options before adding to cart.");
      return;
    }
    const nextQty = Math.min(maxQty, Math.max(1, qty));
    dispatch(
      addToCartThunk({
        productId: product.id,
        qty: nextQty,
        variantId: selectedVariant?.id,
      })
    );
    toast.success("Added to cart.");
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <div className="text-muted small">
            <Link to="/products">Products</Link> / {product.category}
          </div>
          <h1 className="h3 m-0">{product.name}</h1>
        </div>
        {isOutOfStock ? (
          <Badge bg="secondary">Out of stock</Badge>
        ) : (
          <Badge bg="success">In stock</Badge>
        )}
      </div>

      <Row className="g-4">
        {/* Image gallery */}
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

        {/* Details panel */}
        <Col lg={6}>
          <div className="bg-body-tertiary rounded-3 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <div className="h4 text-primary mb-1">{fmt(effectivePrice)}</div>
                <RatingStars rating={product.rating} count={product.ratingCount} />
              </div>
              <div className="text-end">
                <div className="small text-muted">Stock</div>
                <div className="fw-semibold">{effectiveStock}</div>
              </div>
            </div>

            <p className="text-muted mt-3 mb-3">{product.description}</p>

            {/* ---- Variant Selector ---- */}
            {hasVariants && (
              <div className="mb-3">
                {attrKeys.map((attrKey) => (
                  <Form.Group key={attrKey} className="mb-3">
                    <Form.Label className="fw-semibold text-capitalize small">
                      {attrKey}
                      {selectedAttrs[attrKey] && (
                        <span className="ms-2 text-primary">{selectedAttrs[attrKey]}</span>
                      )}
                    </Form.Label>
                    <div className="d-flex flex-wrap gap-2" role="group" aria-label={`Select ${attrKey}`}>
                      {uniqueAttrValues(product.variants, attrKey).map((val) => {
                        // Determine if this option leads to an available variant
                        const isSelected = selectedAttrs[attrKey] === val;
                        const wouldBeOutOfStock = product.variants.some(
                          (v) => v.attributes[attrKey] === val && v.stock === 0
                        );
                        return (
                          <Button
                            key={val}
                            size="sm"
                            variant={isSelected ? "primary" : "outline-secondary"}
                            onClick={() => toggleAttr(attrKey, val)}
                            className="position-relative"
                            style={{ minWidth: 56, borderRadius: 8 }}
                            aria-pressed={isSelected}
                            aria-label={`${attrKey}: ${val}${wouldBeOutOfStock ? " (out of stock)" : ""}`}
                          >
                            {val}
                            {wouldBeOutOfStock && (
                              <span
                                className="position-absolute top-0 end-0"
                                style={{
                                  width: 8, height: 8, borderRadius: "50%",
                                  background: "#dc3545", transform: "translate(25%,-25%)"
                                }}
                                aria-hidden="true"
                              />
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </Form.Group>
                ))}

                {/* Show selected variant SKU when resolved */}
                {selectedVariant?.sku && (
                  <div className="small text-muted mb-2">SKU: {selectedVariant.sku}</div>
                )}
                {variantRequired && (
                  <div className="small text-warning mb-2">
                    Please select all options to add to cart.
                  </div>
                )}
              </div>
            )}

            {/* Quantity + Add to Cart */}
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
                    disabled={isOutOfStock || variantRequired}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={8}>
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={onAdd}
                  disabled={isOutOfStock || variantRequired}
                  aria-label="Add to cart"
                >
                  {isOutOfStock
                    ? "Out of stock"
                    : variantRequired
                    ? "Select options"
                    : "Add to cart"}
                </Button>
              </Col>
            </Row>

            <hr className="my-4" />

            {/* Specs table */}
            <div className="fw-semibold mb-2">Specs</div>
            <Table responsive size="sm" className="mb-0" aria-label="Specifications table">
              <tbody>
                {Object.entries(product.specs || {}).map(([k, v]) => (
                  <tr key={k}>
                    <td className="text-muted" style={{ width: 160 }}>{k}</td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>

      {/* Reviews */}
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
                  <RatingStars
                    rating={r.rating}
                    ariaLabel={`Review rating ${r.rating} out of 5`}
                  />
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
