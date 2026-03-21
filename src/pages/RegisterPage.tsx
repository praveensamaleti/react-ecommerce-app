import React from "react";
import { Button, Card, Form } from "react-bootstrap";
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
    <div className="d-flex justify-content-center">
      <Card className="shadow-sm" style={{ maxWidth: 520, width: "100%" }}>
        <Card.Body>
          <Card.Title className="h4">Register</Card.Title>
          <Card.Text className="text-muted">
            Create an account to track orders and checkout faster.
          </Card.Text>

          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : null}

          <Form onSubmit={handleSubmit(onSubmit)} aria-label="Register form">
            <Form.Group className="mb-3" controlId="registerName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                aria-invalid={Boolean(errors.name)}
                {...register("name", { required: "Name is required" })}
              />
              {errors.name ? (
                <div className="text-danger small mt-1">
                  {errors.name.message}
                </div>
              ) : null}
            </Form.Group>

            <Form.Group className="mb-3" controlId="registerEmail">
              <Form.Label>Email</Form.Label>
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
                <div className="text-danger small mt-1">
                  {errors.email.message}
                </div>
              ) : null}
            </Form.Group>

            <Form.Group className="mb-3" controlId="registerPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                aria-invalid={Boolean(errors.password)}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Min 8 characters" }
                })}
              />
              {errors.password ? (
                <div className="text-danger small mt-1">
                  {errors.password.message}
                </div>
              ) : null}
            </Form.Group>

            <Form.Group className="mb-3" controlId="registerConfirmPassword">
              <Form.Label>Confirm password</Form.Label>
              <Form.Control
                type="password"
                aria-invalid={Boolean(errors.confirmPassword)}
                {...register("confirmPassword", {
                  required: "Please confirm password",
                  validate: (v) => v === password || "Passwords do not match"
                })}
              />
              {errors.confirmPassword ? (
                <div className="text-danger small mt-1">
                  {errors.confirmPassword.message}
                </div>
              ) : null}
            </Form.Group>

            <div className="d-grid">
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create account"}
              </Button>
            </div>
          </Form>

          <div className="text-center mt-3">
            <span className="text-muted">Already have an account?</span>{" "}
            <Link to="/login">Login</Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
