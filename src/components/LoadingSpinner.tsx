import React from "react";
import { Spinner } from "react-bootstrap";

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label }) => {
  return (
    <div className="d-flex align-items-center justify-content-center py-5">
      <Spinner
        animation="border"
        role="status"
        aria-label={label || "Loading"}
      />
      {label ? <span className="ms-3">{label}</span> : null}
    </div>
  );
};

