import React from "react";
import { Button, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearError, registerThunk } from "../store/slices/authSlice";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  const error = useAppSelector((s) => s.auth.error);
  const user = useAppSelector((s) => s.auth.user);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterForm>({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" }
  });

  React.useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const password = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    dispatch(clearError());
    const result = await dispatch(
      registerThunk({ name: data.name, email: data.email, password: data.password })
    );
    if (registerThunk.fulfilled.match(result)) {
      toast.success("Account created!");
      navigate("/");
    } else {
      toast.error("Registration failed.");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-card__logo">React Store</div>
        <h1 className="auth-card__title">Create an account</h1>
        <p className="auth-card__subtitle">Join to track orders and checkout faster</p>

        {error ? (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        ) : null}

        <Form onSubmit={handleSubmit(onSubmit)} aria-label="Register form">
          <Form.Group className="mb-3" controlId="registerName">
            <Form.Label className="fw-semibold small">Full name</Form.Label>
            <Form.Control
              placeholder="Your name"
              aria-invalid={Boolean(errors.name)}
              {...register("name", { required: "Name is required" })}
            />
            {errors.name ? (
              <div className="text-danger small mt-1">{errors.name.message}</div>
            ) : null}
          </Form.Group>

          <Form.Group className="mb-3" controlId="registerEmail">
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

          <Form.Group className="mb-3" controlId="registerPassword">
            <Form.Label className="fw-semibold small">Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Min. 8 characters"
              aria-invalid={Boolean(errors.password)}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Min 8 characters" }
              })}
            />
            {errors.password ? (
              <div className="text-danger small mt-1">{errors.password.message}</div>
            ) : null}
          </Form.Group>

          <Form.Group className="mb-4" controlId="registerConfirmPassword">
            <Form.Label className="fw-semibold small">Confirm password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Repeat password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword", {
                required: "Please confirm password",
                validate: (v) => v === password || "Passwords do not match"
              })}
            />
            {errors.confirmPassword ? (
              <div className="text-danger small mt-1">{errors.confirmPassword.message}</div>
            ) : null}
          </Form.Group>

          <div className="d-grid">
            <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Creating account...
                </>
              ) : "Create account"}
            </Button>
          </div>
        </Form>

        <div className="text-center mt-4" style={{ fontSize: "0.875rem" }}>
          <span style={{ color: "var(--ec-muted)" }}>Already have an account?</span>{" "}
          <Link to="/login" className="fw-semibold" style={{ color: "var(--ec-primary)" }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
