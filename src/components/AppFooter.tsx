import React from "react";
import { Container, Row, Col } from "react-bootstrap";

export const AppFooter: React.FC = () => {
  return (
    <footer className="footer mt-auto" aria-label="Footer">
      <Container fluid="lg">
        <Row className="gy-3 align-items-center">
          <Col md={6}>
            <div className="fw-semibold">React Store</div>
            <div className="small text-white-50">
              A mock e-commerce frontend (no backend).
            </div>
          </Col>
          <Col md={6} className="text-md-end">
            <div className="small">
              Built with React, React Router, Redux Tookit, and Bootstrap.
            </div>
            <div className="small text-white-50">
              © {new Date().getFullYear()} React Store
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

