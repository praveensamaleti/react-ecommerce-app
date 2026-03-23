import React from "react";
import { Button, Card, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Eye, ShoppingCart, Minus, Plus } from "lucide-react";
import type { Product } from "../types/domain";
import { RatingStars } from "./RatingStars";
import { useCurrencyFormatter } from "../hooks/useCurrencyFormatter";

/**
 * ProductCard renders a single product tile in a grid.
 *
 * Variant-awareness:
 * - When a product has variants, "Add to Cart" navigates to the detail page
 *   so the user can select size/color before adding. This prevents adding
 *   a product without a required variant selection.
 * - Once a variant is chosen (on the detail page), the standard qty stepper
 *   is used for that specific (productId + variantId) cart entry.
 */
export const ProductCard: React.FC<{
  product: Product;
  cartQty?: number;
  onAddToCart: (productId: string) => void;
  onRemoveFromCart?: (productId: string) => void;
  onQtyChange?: (productId: string, qty: number) => void;
  onQuickView?: (product: Product) => void;
}> = ({ product, cartQty = 0, onAddToCart, onRemoveFromCart, onQtyChange, onQuickView }) => {
  const fmt = useCurrencyFormatter();
  const hasVariants = product.variants && product.variants.length > 0;

  // The effective display price: use the lowest variant price when variants exist
  const displayPrice = React.useMemo(() => {
    if (!hasVariants) return product.price;
    const prices = product.variants
      .map((v) => v.price ?? product.price)
      .sort((a, b) => a - b);
    return prices[0];
  }, [product.price, product.variants, hasVariants]);

  const pricePrefix = hasVariants ? "From " : "";

  return (
    <Card className="h-100 card-hover shadow-sm" aria-label={product.name}>
      {/* Image with category overlay */}
      <div className="product-img-wrap">
        <Link to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
          <img
            src={product.images[0]}
            alt={product.name}
            className="card-img-top"
            style={{ height: 200, objectFit: "cover", width: "100%" }}
          />
        </Link>
        {product.category && (
          <span className="product-category-tag">{product.category}</span>
        )}
        {product.stock <= 0 && !hasVariants && (
          <Badge
            bg="danger"
            style={{
              position: "absolute", top: 10, right: 10,
              borderRadius: 20, fontSize: "0.67rem",
            }}
          >
            Out of stock
          </Badge>
        )}
        {hasVariants && (
          <Badge
            bg="info"
            style={{
              position: "absolute", top: 10, left: 10,
              borderRadius: 20, fontSize: "0.67rem",
            }}
          >
            {product.variants.length} options
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column pt-3">
        <div className="fw-semibold mb-1 lh-sm" style={{ fontSize: "0.92rem" }}>
          {product.name}
        </div>

        <div className="d-flex align-items-center justify-content-between mt-1 mb-auto">
          <div className="fw-bold" style={{ color: "var(--ec-primary)", fontSize: "1rem" }}>
            {pricePrefix}{fmt(displayPrice)}
          </div>
          <RatingStars rating={product.rating} count={product.ratingCount} />
        </div>

        {/* Colour swatches (max 5 shown inline) */}
        {hasVariants && (() => {
          const colorValues = Array.from(
            new Set(
              product.variants
                .map((v) => v.attributes["color"] || v.attributes["Color"])
                .filter(Boolean)
            )
          ).slice(0, 5);

          return colorValues.length > 0 ? (
            <div className="d-flex gap-1 mt-2" aria-label="Available colours">
              {colorValues.map((color) => (
                <Link
                  key={color}
                  to={`/products/${product.id}`}
                  title={color}
                  aria-label={color}
                  style={{
                    display: "inline-block",
                    width: 16, height: 16, borderRadius: "50%",
                    background: color.toLowerCase(),
                    border: "1px solid rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}
                />
              ))}
              {product.variants.length > 5 && (
                <span className="text-muted" style={{ fontSize: "0.72rem", lineHeight: "16px" }}>
                  +{product.variants.length - 5}
                </span>
              )}
            </div>
          ) : null;
        })()}

        <div className="mt-3 d-flex gap-2">
          {hasVariants ? (
            /* Products with variants require detail-page selection */
            <Link
              to={`/products/${product.id}`}
              className="btn btn-primary btn-sm w-100"
              aria-label={`Select options for ${product.name}`}
            >
              <ShoppingCart size={14} className="me-1" aria-hidden="true" />
              Select options
            </Link>
          ) : cartQty > 0 ? (
            /* Inline qty stepper for simple products already in cart */
            <div
              className="d-flex align-items-center gap-1 flex-grow-1"
              role="group"
              aria-label={`Quantity for ${product.name}`}
            >
              <Button
                variant="outline-secondary"
                size="sm"
                style={{ borderRadius: 8, width: 30, height: 30, padding: 0 }}
                onClick={() => {
                  if (cartQty <= 1) {
                    onRemoveFromCart?.(product.id);
                  } else {
                    onQtyChange?.(product.id, cartQty - 1);
                  }
                }}
                aria-label={`Decrease quantity for ${product.name}`}
              >
                <Minus size={13} />
              </Button>
              <span
                className="px-2 fw-bold"
                style={{ fontSize: "0.95rem", minWidth: 24, textAlign: "center" }}
              >
                {cartQty}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                style={{ borderRadius: 8, width: 30, height: 30, padding: 0 }}
                onClick={() => onQtyChange?.(product.id, cartQty + 1)}
                aria-label={`Increase quantity for ${product.name}`}
              >
                <Plus size={13} />
              </Button>
            </div>
          ) : (
            /* Simple product not yet in cart */
            <Button
              variant="primary"
              className="w-100"
              size="sm"
              onClick={() => onAddToCart(product.id)}
              disabled={product.stock <= 0}
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart size={14} className="me-1" aria-hidden="true" />
              Add to Cart
            </Button>
          )}

          {onQuickView && !hasVariants ? (
            <Button
              variant="outline-primary"
              size="sm"
              style={{ borderRadius: 8, minWidth: 34, padding: "0.25rem 0.5rem" }}
              onClick={() => onQuickView(product)}
              aria-label={`Quick view ${product.name}`}
            >
              <Eye size={14} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </Card.Body>
    </Card>
  );
};
