import React from "react";
import { Badge, Form, Image } from "react-bootstrap";
import { Trash2 } from "lucide-react";
import type { Product } from "../types/domain";
import { useCurrencyFormatter } from "../hooks/useCurrencyFormatter";

export const CartItemRow: React.FC<{
  product: Product;
  qty: number;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
  outOfStock?: boolean;
  insufficientStock?: boolean;
  availableStock?: number;
}> = ({ product, qty, onQtyChange, onRemove, outOfStock, insufficientStock, availableStock }) => {
  const fmt = useCurrencyFormatter();
  const lineTotal = product.price * qty;
  return (
    <div className="cart-item-row" aria-label={`Cart item ${product.name}`}>
      <div className="d-flex gap-3 align-items-start">
        <Image
          src={product.images[0]}
          alt={product.name}
          rounded
          width={88}
          height={88}
          style={{ objectFit: "cover", borderRadius: 12, flexShrink: 0 }}
        />
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <div>
              <div className="fw-semibold" style={{ fontSize: "0.95rem" }}>
                {product.name}
              </div>
              <div className="mt-1 d-flex gap-1 flex-wrap">
                {outOfStock && <Badge bg="danger" style={{ borderRadius: 20, fontSize: "0.67rem" }}>Out of stock</Badge>}
                {insufficientStock && !outOfStock && (
                  <Badge bg="warning" text="dark" style={{ borderRadius: 20, fontSize: "0.67rem" }}>
                    Only {availableStock} available
                  </Badge>
                )}
              </div>
              <div className="text-muted mt-1" style={{ fontSize: "0.82rem" }}>
                {fmt(product.price)} each
              </div>
            </div>
            <button
              onClick={onRemove}
              aria-label={`Remove ${product.name} from cart`}
              style={{
                background: "none",
                border: "1px solid #fee2e2",
                borderRadius: 8,
                padding: "5px 7px",
                color: "#ef4444",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="d-flex align-items-center gap-2">
              <Form.Label className="m-0 text-muted" htmlFor={`qty-${product.id}`} style={{ fontSize: "0.82rem" }}>
                Qty
              </Form.Label>
              <Form.Control
                id={`qty-${product.id}`}
                type="number"
                min={1}
                max={Math.max(1, Math.min(99, product.stock || 99))}
                value={qty}
                onChange={(e) => onQtyChange(Number(e.target.value))}
                className="qty-input"
                aria-label={`Quantity for ${product.name}`}
              />
            </div>
            <div className="fw-bold" style={{ color: "var(--ec-primary)", fontSize: "1rem" }}>
              {fmt(lineTotal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
