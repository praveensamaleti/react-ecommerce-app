import React from "react";
import { Badge, Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, User as UserIcon, LogOut, Shield } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { LinkButton } from "./LinkButton";
import { ThemeToggle } from "./ThemeToggle";

export const AppNavbar: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.totals.itemCount);

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <Navbar bg="body" expand="lg" fixed="top" className="shadow-sm" aria-label="Main navigation">
      <Container fluid="lg">
        <Navbar.Brand as={Link} to="/" className="fw-bold text-primary">
          React Store
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end>
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/products">
              Products
            </Nav.Link>
          </Nav>

          <Nav className="ms-auto align-items-lg-center gap-lg-2">
            <ThemeToggle />
            <Nav.Link as={NavLink} to="/cart" aria-label="Cart">
              <span className="d-inline-flex align-items-center gap-2">
                <ShoppingCart size={18} aria-hidden="true" />
                Cart
                <Badge bg="primary" pill aria-label={`${itemCount} items in cart`}>
                  {itemCount}
                </Badge>
              </span>
            </Nav.Link>

            {user ? (
              <NavDropdown
                title={
                  <span className="d-inline-flex align-items-center gap-2">
                    <UserIcon size={18} aria-hidden="true" />
                    {user.name}
                  </span>
                }
                id="user-menu"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  Profile
                </NavDropdown.Item>
                {user.role === "admin" ? (
                  <NavDropdown.Item as={Link} to="/admin">
                    <span className="d-inline-flex align-items-center gap-2">
                      <Shield size={16} aria-hidden="true" /> Admin
                    </span>
                  </NavDropdown.Item>
                ) : null}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={onLogout}>
                  <span className="d-inline-flex align-items-center gap-2">
                    <LogOut size={16} aria-hidden="true" /> Logout
                  </span>
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <div className="d-flex gap-2">
                <LinkButton to="/login" variant="outline-primary" size="sm">
                  Login
                </LinkButton>
                <LinkButton to="/register" variant="primary" size="sm">
                  Register
                </LinkButton>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

