import React from "react";
import { Button } from "react-bootstrap";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "../stores/themeStore";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <Button
      variant={theme === "dark" ? "outline-light" : "outline-secondary"}
      size="sm"
      onClick={toggleTheme}
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
