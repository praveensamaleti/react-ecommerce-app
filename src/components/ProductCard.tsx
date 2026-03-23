import React from "react";
import { Button, Card, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Eye, ShoppingCart, Minus, Plus } from "lucide-react";
import type { Product } from "../types/domain";
import { RatingStars } from "./RatingStars";
import { useCurrencyFormatter } from "../hooks/useCurrencyFormatter";

export const ProductCard: React.FC<{
  product: Product;
  cartQty?: number;
  onAddToCart: (productId: string) => void;
  onRemoveFromCart?: (productId: string) => void;
  onQtyChange?: (productId: string, qty: number) => void;
  onQuickView?: (product: Product) => void;
}> = ({ product, cartQty = 0, onAddToCart, onRemoveFromCart, onQtyChange, onQuickView }) => {
  const fmt = useCurrencyFormatter();
  return (
    <Card className="h-100 card-hover shadow-sm" aria-label={product.name}>
      {/* Image with zoom + category overlay */}
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
        {product.stock <= 0 && (
          <Badge
            bg="danger"
            style={{ position: "absolute", top: 10, right: 10, borderRadius: 20, fontSize: "0.67rem" }}
          >
            Out of stock
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column pt-3">
        <div className="fw-semibold mb-1 lh-sm" style={{ fontSize: "0.92rem" }}>
          {product.name}
        </div>
        <div className="d-flex align-items-center justify-content-between mt-1 mb-auto">
          <div className="fw-bold" style={{ color: "var(--ec-primary)", fontSize: "1rem" }}>
            {fmt(product.price)}
          </div>
          <RatingStars rating={product.rating} count={product.ratingCount} />
        </div>

        <div className="mt-3 d-flex gap-2">
          {cartQty > 0 ? (
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
              <span className="px-2 fw-bold" style={{ fontSize: "0.95rem", minWidth: 24, textAlign: "center" }}>
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
          {onQuickView ? (
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
