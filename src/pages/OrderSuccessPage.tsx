import React from "react";
import { useLocation } from "react-router-dom";
import { LinkButton } from "../components/LinkButton";

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const orderId = (location.state as { orderId?: string } | null)?.orderId;

  return (
    <div className="success-wrap">
      <div className="success-card">
        <div className="success-icon-ring" aria-hidden="true">✓</div>

        <h1 className="success-card__title">Order confirmed!</h1>
        <p style={{ color: "var(--ec-muted)", marginBottom: orderId ? "0.35rem" : "2rem" }}>
          Your purchase was placed successfully.
        </p>
        {orderId ? (
          <p
            className="mb-4"
            style={{
              fontSize: "0.875rem",
              color: "var(--ec-muted)",
              background: "rgba(var(--ec-primary-rgb), 0.07)",
              border: "1px solid rgba(var(--ec-primary-rgb), 0.15)",
              borderRadius: "8px",
              padding: "0.5rem 0.9rem",
              display: "inline-block"
            }}
          >
            Order ID: <strong style={{ color: "var(--ec-body-color)" }}>#{orderId}</strong>
          </p>
        ) : null}

        <div className="d-flex justify-content-center gap-3 flex-wrap mt-2">
          <LinkButton to="/products" variant="primary">
            Continue shopping
          </LinkButton>
          <LinkButton to="/profile" variant="outline-primary">
            View orders
          </LinkButton>
        </div>
      </div>
    </div>
  );
};
