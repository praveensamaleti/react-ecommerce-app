import React from "react";
import { Card } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { LinkButton } from "../components/LinkButton";

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const orderId = (location.state as { orderId?: string } | null)?.orderId;

  return (
    <div className="d-flex justify-content-center">
      <Card className="shadow-sm" style={{ maxWidth: 560, width: "100%" }}>
        <Card.Body className="text-center">
          <div className="h3 text-primary">Success!</div>
          <p className="text-muted mb-4">
            Your order has been placed{orderId ? ` (Order #${orderId})` : ""}.
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <LinkButton to="/products" variant="primary">
              Continue shopping
            </LinkButton>
            <LinkButton to="/profile" variant="outline-primary">
              View profile
            </LinkButton>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

