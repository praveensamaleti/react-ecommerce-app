import React from "react";
import { Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAuthStore } from "../stores/authStore";
import { useOrdersStore } from "../stores/ordersStore";
import { LoadingSpinner } from "../components/LoadingSpinner";

type ProfileForm = {
  name: string;
  email: string;
};

export const ProfilePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const loadOrdersForUser = useOrdersStore((s) => s.loadOrdersForUser);
  const orders = useOrdersStore((s) => s.orders);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const error = useOrdersStore((s) => s.error);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: { name: user?.name || "", email: user?.email || "" }
  });

  React.useEffect(() => {
    reset({ name: user?.name || "", email: user?.email || "" });
  }, [user?.name, user?.email, reset]);

  React.useEffect(() => {
    if (user) loadOrdersForUser(user.id);
  }, [user, loadOrdersForUser]);

  if (!user) return null;

  const onSubmit = (data: ProfileForm) => {
    updateProfile({ name: data.name, email: data.email });
    toast.success("Profile updated.");
  };

  return (
    <Row className="g-4">
      <Col lg={4}>
        <Card className="shadow-sm">
          <Card.Body>
            <Card.Title>Profile</Card.Title>
            <Form onSubmit={handleSubmit(onSubmit)} aria-label="Profile edit form">
              <Form.Group className="mb-3" controlId="profileName">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  aria-invalid={Boolean(errors.name)}
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name ? (
                  <div className="text-danger small mt-1">{errors.name.message}</div>
                ) : null}
              </Form.Group>
              <Form.Group className="mb-3" controlId="profileEmail">
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
              <div className="d-grid">
                <Button type="submit" variant="primary">
                  Save changes
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={8}>
        <Card className="shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">Order history</Card.Title>
              <div className="small text-muted">{orders.length} orders</div>
            </div>

            {isLoading ? <LoadingSpinner label="Loading orders..." /> : null}
            {error ? <div className="alert alert-danger">{error}</div> : null}

            {!isLoading && !error ? (
              <Table responsive hover className="mt-3" aria-label="Order history table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="fw-semibold">#{o.id}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="text-capitalize">{o.status}</td>
                      <td className="text-end">{o.items.reduce((s, it) => s + it.qty, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : null}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

