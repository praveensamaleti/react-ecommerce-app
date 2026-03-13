import React, { useMemo, useState } from "react";
import { Button, Modal, Row, Col, Form } from "react-bootstrap";
import type { Product } from "../types/domain";
import { RatingStars } from "./RatingStars";
import { formatMoney } from "../utils/money";
import { LinkButton } from "./LinkButton";

export const QuickViewModal: React.FC<{
  product: Product | null;
  show: boolean;
  onHide: () => void;
  onAddToCart: (productId: string, qty: number) => void;
}> = ({ product, show, onHide, onAddToCart }) => {
  const [qty, setQty] = useState(1);

  const maxQty = useMemo(() => {
    if (!product) return 1;
    return Math.max(1, Math.min(99, product.stock || 1));
  }, [product]);

  React.useEffect(() => {
    setQty(1);
  }, [product?.id, show]);

  if (!product) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      aria-labelledby="quick-view-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="quick-view-title">{product.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-4">
          <Col md={6}>
            <img
              src={product.images[0]}
              alt={product.name}
              className="img-fluid rounded shadow-sm"
              style={{ width: "100%", height: 320, objectFit: "cover" }}
            />
          </Col>
          <Col md={6}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="h4 m-0 text-primary">
                {formatMoney(product.price)}
              </div>
              <RatingStars
                rating={product.rating}
                count={product.ratingCount}
              />
            </div>
            <p className="text-muted mt-3">{product.description}</p>

            <Form.Group controlId="quickviewQty" className="mt-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={maxQty}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                aria-label="Quantity"
              />
              <div className="small text-muted mt-1">
                {product.stock} in stock
              </div>
            </Form.Group>

            <div className="mt-4 d-flex gap-2">
              <Button
                variant="primary"
                className="flex-grow-1"
                onClick={() => onAddToCart(product.id, Math.min(maxQty, Math.max(1, qty)))}
                disabled={product.stock <= 0}
              >
                Add to cart
              </Button>
              <LinkButton to={`/products/${product.id}`} variant="outline-primary" onClick={onHide}>
                Details
              </LinkButton>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

