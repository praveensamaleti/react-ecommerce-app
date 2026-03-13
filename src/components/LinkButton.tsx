import React from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark"
  | "link"
  | "outline-primary"
  | "outline-secondary"
  | "outline-success"
  | "outline-danger"
  | "outline-warning"
  | "outline-info"
  | "outline-light"
  | "outline-dark";

type Size = "sm" | "lg";

type Props = React.PropsWithChildren<{
  to: LinkProps["to"];
  replace?: LinkProps["replace"];
  state?: LinkProps["state"];
  variant?: Variant;
  size?: Size;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  "aria-label"?: string;
}>;

// React-Bootstrap's polymorphic typing doesn't always like React Router's Link.
// This wrapper keeps call-sites clean and avoids TS noise.
export const LinkButton: React.FC<Props> = ({
  to,
  replace,
  state,
  variant = "primary",
  size,
  className,
  disabled,
  onClick,
  children,
  ...rest
}) => {
  const classes = [
    "btn",
    variant.startsWith("outline-") ? `btn-${variant}` : `btn-${variant}`,
    size ? `btn-${size}` : "",
    disabled ? "disabled" : "",
    className || ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      to={to}
      replace={replace}
      state={state}
      className={classes}
      aria-disabled={disabled ? "true" : undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
};

