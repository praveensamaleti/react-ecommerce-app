import React from "react";
import { Container, Row, Col } from "react-bootstrap";

export const AppFooter: React.FC = () => {
  return (
    <footer className="footer mt-auto" aria-label="Footer">
      <Container fluid="lg">
        <Row className="gy-3 align-items-center">
          <Col md={6}>
            <div className="fw-bold" style={{ color: "white", fontSize: "1rem", letterSpacing: "-0.02em" }}>
              React Store
            </div>
            <div style={{ color: "var(--ec-footer-color)", fontSize: "0.82rem", marginTop: 4 }}>
              Modern e-commerce, powered by React & Redux.
            </div>
          </Col>
          <Col md={6} className="text-md-end">
            <div style={{ color: "var(--ec-footer-color)", fontSize: "0.82rem" }}>
              Built with React 18 · Redux Toolkit · Bootstrap 5
            </div>
            <div style={{ color: "#475569", fontSize: "0.78rem", marginTop: 4 }}>
              © {new Date().getFullYear()} React Store
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};
