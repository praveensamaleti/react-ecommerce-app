import React from "react";
import { Button, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearError, loginThunk } from "../store/slices/authSlice";

type LoginForm = {
  email: string;
  password: string;
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  const error = useAppSelector((s) => s.auth.error);
  const user = useAppSelector((s) => s.auth.user);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({ defaultValues: { email: "", password: "" } });

  React.useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const onSubmit = async (data: LoginForm) => {
    dispatch(clearError());
    const result = await dispatch(loginThunk({ email: data.email, password: data.password }));
    if (loginThunk.fulfilled.match(result)) {
      toast.success("Welcome back!");
      navigate("/");
    } else {
      toast.error("Login failed.");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-card__logo">React Store</div>
        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to your account to continue shopping</p>

        <div
          className="rounded-3 mb-4 px-3 py-2"
          style={{
            background: "rgba(var(--ec-primary-rgb), 0.07)",
            border: "1px solid rgba(var(--ec-primary-rgb), 0.15)",
            fontSize: "0.8rem",
            color: "var(--ec-muted)"
          }}
        >
          Demo: <strong>user@example.com</strong> / <strong>Password123!</strong>
          &nbsp;&nbsp;or&nbsp;&nbsp;
          <strong>admin@example.com</strong> / <strong>Admin123!</strong>
        </div>

        {error ? (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        ) : null}

        <Form onSubmit={handleSubmit(onSubmit)} aria-label="Login form">
          <Form.Group className="mb-3" controlId="loginEmail">
            <Form.Label className="fw-semibold small">Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="you@example.com"
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

          <Form.Group className="mb-4" controlId="loginPassword">
            <Form.Label className="fw-semibold small">Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
              {...register("password", { required: "Password is required" })}
            />
            {errors.password ? (
              <div className="text-danger small mt-1">{errors.password.message}</div>
            ) : null}
          </Form.Group>

          <div className="d-grid">
            <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Signing in...
                </>
              ) : "Sign in"}
            </Button>
          </div>
        </Form>

        <div className="text-center mt-4" style={{ fontSize: "0.875rem" }}>
          <span style={{ color: "var(--ec-muted)" }}>Don't have an account?</span>{" "}
          <Link to="/register" className="fw-semibold" style={{ color: "var(--ec-primary)" }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};
