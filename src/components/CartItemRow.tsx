import React from "react";
import { Button, Form, Image } from "react-bootstrap";
import { Trash2 } from "lucide-react";
import type { Product } from "../types/domain";
import { useCurrencyFormatter } from "../hooks/useCurrencyFormatter";

export const CartItemRow: React.FC<{
  product: Product;
  qty: number;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}> = ({ product, qty, onQtyChange, onRemove }) => {
  const fmt = useCurrencyFormatter();
  const lineTotal = product.price * qty;
  return (
    <div className="d-flex gap-3 py-3 border-bottom" aria-label={`Cart item ${product.name}`}>
      <Image
        src={product.images[0]}
        alt={product.name}
        rounded
        width={84}
        height={84}
        style={{ objectFit: "cover" }}
      />
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div className="fw-semibold">{product.name}</div>
            <div className="text-muted small">{fmt(product.price)} each</div>
          </div>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={onRemove}
            aria-label={`Remove ${product.name} from cart`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </Button>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="d-flex align-items-center gap-2">
            <Form.Label className="m-0 small" htmlFor={`qty-${product.id}`}>
              Qty
            </Form.Label>
            <Form.Control
              id={`qty-${product.id}`}
              type="number"
              min={1}
              max={Math.max(1, Math.min(99, product.stock || 99))}
              value={qty}
              onChange={(e) => onQtyChange(Number(e.target.value))}
              style={{ width: 90 }}
              aria-label={`Quantity for ${product.name}`}
            />
          </div>
          <div className="fw-semibold">{fmt(lineTotal)}</div>
        </div>
      </div>
    </div>
  );
};

