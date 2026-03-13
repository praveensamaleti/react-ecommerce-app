import React from "react";
import { Button } from "react-bootstrap";

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="text-center py-5" role="status" aria-live="polite">
      <h2 className="h4">{title}</h2>
      {description ? <p className="text-muted">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

