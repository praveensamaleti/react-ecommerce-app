import React from "react";
import { Badge, Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, User as UserIcon, LogOut, Shield } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutThunk } from "../store/slices/authSlice";
import { LinkButton } from "./LinkButton";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencySelector } from "./CurrencySelector";

export const AppNavbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const itemCount = useAppSelector((s) => s.cart.totals.itemCount);

  const onLogout = async () => {
    await dispatch(logoutThunk());
    navigate("/");
  };

  return (
    <Navbar bg="body" expand="lg" fixed="top" className="navbar-glass" aria-label="Main navigation">
      <Container fluid="lg">
        <Navbar.Brand as={Link} to="/" className="navbar-brand-modern">
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
            <CurrencySelector />
            <Nav.Link as={NavLink} to="/cart" aria-label="Cart" className="navbar-cart-link">
              <span className="position-relative d-inline-flex align-items-center">
                <ShoppingCart size={18} aria-hidden="true" />
                <Badge bg="danger" pill className="navbar-cart-badge" aria-label={`${itemCount} items in cart`}>
                  {itemCount}
                </Badge>
              </span>
            </Nav.Link>

            {user ? (
              <NavDropdown
                className="navbar-user-dropdown"
                title={
                  <span className="d-inline-flex align-items-center gap-2">
                    <span className="navbar-user-avatar">
                      <UserIcon size={13} aria-hidden="true" />
                    </span>
                    {user.name}
                  </span>
                }
                id="user-menu"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <UserIcon size={14} className="me-2 navbar-dropdown-icon" aria-hidden="true" />
                  Profile
                </NavDropdown.Item>
                {user.role === "admin" ? (
                  <NavDropdown.Item as={Link} to="/admin">
                    <Shield size={14} className="me-2 navbar-dropdown-icon" aria-hidden="true" />
                    Admin
                  </NavDropdown.Item>
                ) : null}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={onLogout} className="navbar-dropdown-logout">
                  <LogOut size={14} className="me-2 navbar-dropdown-icon" aria-hidden="true" />
                  Logout
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
