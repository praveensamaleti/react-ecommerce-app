import React from "react";
import { Button } from "react-bootstrap";
import { Sun, Moon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { toggleTheme } from "../store/slices/themeSlice";

export const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.theme.theme);
  return (
    <Button
      variant={theme === "dark" ? "outline-light" : "outline-secondary"}
      size="sm"
      onClick={() => dispatch(toggleTheme())}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="d-flex align-items-center"
    >
      {theme === "dark" ? (
        <Sun size={16} aria-hidden="true" />
      ) : (
        <Moon size={16} aria-hidden="true" />
      )}
    </Button>
  );
};
