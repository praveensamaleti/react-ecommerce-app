import React from "react";
import { Star } from "lucide-react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const RatingStars: React.FC<{
  rating: number;
  count?: number;
  size?: number;
  ariaLabel?: string;
}> = ({ rating, count, size = 16, ariaLabel }) => {
  const r = clamp(rating, 0, 5);
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <span
      className="d-inline-flex align-items-center gap-1"
      aria-label={ariaLabel || `Rated ${r.toFixed(1)} out of 5`}
      role="img"
    >
      {Array.from({ length: full }).map((_, i) => (
        <Star
          key={`f-${i}`}
          size={size}
          fill="#f59e0b"
          color="#f59e0b"
          aria-hidden="true"
        />
      ))}
      {half ? (
        <Star
          key="h"
          size={size}
          fill="#fde68a"
          color="#f59e0b"
          aria-hidden="true"
        />
      ) : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star
          key={`e-${i}`}
          size={size}
          fill="transparent"
          color="#94a3b8"
          aria-hidden="true"
        />
      ))}
      {typeof count === "number" ? (
        <span className="ms-1 small text-muted" aria-hidden="true">
          ({count})
        </span>
      ) : null}
    </span>
  );
};

