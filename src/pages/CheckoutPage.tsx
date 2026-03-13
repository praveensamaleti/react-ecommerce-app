import React from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import type { Address, Payment } from "../types/domain";
import { formatMoney } from "../utils/money";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useProductsStore } from "../stores/productsStore";
import { useOrdersStore } from "../stores/ordersStore";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useCartAutoTotals } from "../hooks/useCartAutoTotals";

type CheckoutForm = Address &
  Payment & {
    billingSameAsShipping: boolean;
  };

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals);
  const clearCart = useCartStore((s) => s.clearCart);

  const { products, isLoading: productsLoading, loadProducts } = useProductsStore();
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  const ordersLoading = useOrdersStore((s) => s.isLoading);
  useCartAutoTotals();

  React.useEffect(() => {
    if (products.length === 0) loadProducts();
  }, [products.length, loadProducts]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CheckoutForm>({
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      billingSameAsShipping: true,
      cardName: user?.name || "",
      cardNumber: "4242 4242 4242 4242",
      exp: "12/30",
      cvc: "123"
    }
  });

  const billingSame = watch("billingSameAsShipping");

  if (productsLoading && products.length === 0) {
    return <LoadingSpinner label="Preparing checkout..." />;
  }

  if (!user) {
    return (
      <EmptyState
        title="Please login to checkout"
        description="You must be signed in to place an order."
        actionLabel="Go to login"
        onAction={() => navigate("/login")}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Cart is empty"
        description="Add items before checking out."
        actionLabel="Browse products"
        onAction={() => navigate("/products")}
      />
    );
  }

  const onSubmit = async (data: CheckoutForm) => {
    const shipping: Address = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      address1: data.address1,
      address2: data.address2 || undefined,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country
    };

    const billing: Address = billingSame
      ? shipping
      : {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          address1: data.address1,
          address2: data.address2 || undefined,
          city: data.city,
          state: data.state,
          zip: data.zip,
          country: data.country
        };

    const payment: Payment = {
      cardName: data.cardName,
      cardNumber: data.cardNumber,
      exp: data.exp,
      cvc: data.cvc
    };

    const order = await placeOrder({
      user,
      items,
      products,
      shipping,
      billing,
      payment
    });

    if (!order) {
      toast.error("Could not place order. Please try again.");
      return;
    }

    clearCart();
    toast.success("Order placed!");
    navigate("/order-success", { state: { orderId: order.id } });
  };

  return (
    <Row className="g-4">
      <Col lg={8}>
        <h1 className="h3 mb-3">Checkout</h1>
        <Card className="shadow-sm">
          <Card.Body>
            <Form onSubmit={handleSubmit(onSubmit)} aria-label="Checkout form">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="fullName">
                    <Form.Label>Full name</Form.Label>
                    <Form.Control
                      aria-invalid={Boolean(errors.fullName)}
                      {...register("fullName", { required: "Full name is required" })}
                    />
                    {errors.fullName ? (
                      <div className="text-danger small mt-1">{errors.fullName.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      aria-invalid={Boolean(errors.email)}
                      {...register("email", {
                        required: "Email is required",
                        pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" }
                      })}
                    />
                    {errors.email ? (
                      <div className="text-danger small mt-1">{errors.email.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="phone">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      aria-invalid={Boolean(errors.phone)}
                      {...register("phone", { required: "Phone is required" })}
                    />
                    {errors.phone ? (
                      <div className="text-danger small mt-1">{errors.phone.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="country">
                    <Form.Label>Country</Form.Label>
                    <Form.Select {...register("country", { required: true })} aria-label="Country">
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="IN">India</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group controlId="address1">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      placeholder="Street address"
                      aria-invalid={Boolean(errors.address1)}
                      {...register("address1", { required: "Address is required" })}
                    />
                    {errors.address1 ? (
                      <div className="text-danger small mt-1">{errors.address1.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group controlId="address2">
                    <Form.Label>Address 2 (optional)</Form.Label>
                    <Form.Control placeholder="Apartment, suite, etc." {...register("address2")} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="city">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      aria-invalid={Boolean(errors.city)}
                      {...register("city", { required: "City is required" })}
                    />
                    {errors.city ? (
                      <div className="text-danger small mt-1">{errors.city.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="state">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      aria-invalid={Boolean(errors.state)}
                      {...register("state", { required: "State is required" })}
                    />
                    {errors.state ? (
                      <div className="text-danger small mt-1">{errors.state.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="zip">
                    <Form.Label>ZIP / Postal code</Form.Label>
                    <Form.Control
                      aria-invalid={Boolean(errors.zip)}
                      {...register("zip", { required: "ZIP is required" })}
                    />
                    {errors.zip ? (
                      <div className="text-danger small mt-1">{errors.zip.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>

                <Col md={12} className="mt-2">
                  <Form.Check
                    type="checkbox"
                    label="Billing address same as shipping"
                    {...register("billingSameAsShipping")}
                  />
                </Col>

                <Col md={12}>
                  <hr className="my-2" />
                  <div className="fw-semibold mb-2">Payment (mock)</div>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="cardName">
                    <Form.Label>Name on card</Form.Label>
                    <Form.Control
                      aria-invalid={Boolean(errors.cardName)}
                      {...register("cardName", { required: "Name on card is required" })}
                    />
                    {errors.cardName ? (
                      <div className="text-danger small mt-1">{errors.cardName.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="cardNumber">
                    <Form.Label>Card number</Form.Label>
                    <Form.Control
                      aria-invalid={Boolean(errors.cardNumber)}
                      {...register("cardNumber", {
                        required: "Card number is required",
                        minLength: { value: 12, message: "Invalid card number" }
                      })}
                    />
                    {errors.cardNumber ? (
                      <div className="text-danger small mt-1">{errors.cardNumber.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="exp">
                    <Form.Label>Expiry</Form.Label>
                    <Form.Control
                      placeholder="MM/YY"
                      aria-invalid={Boolean(errors.exp)}
                      {...register("exp", { required: "Expiry is required" })}
                    />
                    {errors.exp ? (
                      <div className="text-danger small mt-1">{errors.exp.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="cvc">
                    <Form.Label>CVC</Form.Label>
                    <Form.Control
                      aria-invalid={Boolean(errors.cvc)}
                      {...register("cvc", { required: "CVC is required" })}
                    />
                    {errors.cvc ? (
                      <div className="text-danger small mt-1">{errors.cvc.message}</div>
                    ) : null}
                  </Form.Group>
                </Col>

                <Col md={12} className="mt-3">
                  <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={ordersLoading}>
                      {ordersLoading ? "Placing order..." : "Place order"}
                    </Button>
                  </div>
                  <div className="small text-muted mt-2">
                    This is a demo checkout; no real payment is processed.
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={4}>
        <Card className="shadow-sm">
          <Card.Body>
            <Card.Title>Order summary</Card.Title>
            <div className="d-flex justify-content-between mt-3">
              <span className="text-muted">Subtotal</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span className="text-muted">Discount (10%)</span>
              <span>-{formatMoney(totals.discount)}</span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span className="text-muted">Tax</span>
              <span>{formatMoney(totals.tax)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-semibold">
              <span>Total</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

