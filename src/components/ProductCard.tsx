import React from "react";
import { Button, Card, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Eye, ShoppingCart } from "lucide-react";
import type { Product } from "../types/domain";
import { RatingStars } from "./RatingStars";
import { useCurrencyFormatter } from "../hooks/useCurrencyFormatter";

export const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (productId: string) => void;
  onQuickView?: (product: Product) => void;
}> = ({ product, onAddToCart, onQuickView }) => {
  const fmt = useCurrencyFormatter();
  return (
    <Card className="h-100 card-hover shadow-sm" aria-label={product.name}>
      <Link to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
        <Card.Img
          variant="top"
          src={product.images[0]}
          alt={product.name}
          style={{ height: 190, objectFit: "cover" }}
        />
      </Link>
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div className="fw-semibold">{product.name}</div>
          {product.stock <= 0 ? (
            <Badge bg="secondary">Out of stock</Badge>
          ) : null}
        </div>
        <div className="d-flex align-items-center justify-content-between mt-2">
          <div className="fw-bold text-primary">{fmt(product.price)}</div>
          <RatingStars rating={product.rating} count={product.ratingCount} />
        </div>
        <div className="mt-auto pt-3 d-flex gap-2">
          <Button
            variant="primary"
            className="w-100"
            onClick={() => onAddToCart(product.id)}
            disabled={product.stock <= 0}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={16} className="me-2" aria-hidden="true" />
            Add
          </Button>
          {onQuickView ? (
            <Button
              variant="outline-primary"
              onClick={() => onQuickView(product)}
              aria-label={`Quick view ${product.name}`}
            >
              <Eye size={16} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </Card.Body>
    </Card>
  );
};

