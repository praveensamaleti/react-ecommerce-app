import React from "react";
import { Button, Card, Col, Form, Row, Table, Tabs, Tab, Badge } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import type { Category, Product } from "../types/domain";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loadProductsThunk,
  upsertProductThunk,
  deleteProductThunk,
} from "../store/slices/productsSlice";
import {
  loadOrdersForUserThunk,
  updateOrderStatusThunk,
} from "../store/slices/ordersSlice";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useCurrencyFormatter } from "../hooks/useCurrencyFormatter";

type ProductForm = {
  id?: string;
  name: string;
  price: number;
  category: Category;
  stock: number;
  imageUrl: string;
  description: string;
};

const newId = () => `p${Math.floor(Math.random() * 90000) + 10000}`;

export const AdminDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((s) => s.products.products);
  const isLoading = useAppSelector((s) => s.products.isLoading);
  const error = useAppSelector((s) => s.products.error);
  const orders = useAppSelector((s) => s.orders.orders);

  const fmt = useCurrencyFormatter();
  const [editing, setEditing] = React.useState<Product | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({
    defaultValues: {
      name: "",
      price: 0,
      category: "Electronics",
      stock: 0,
      imageUrl: "",
      description: ""
    }
  });

  React.useEffect(() => {
    if (products.length === 0) dispatch(loadProductsThunk());
  }, [products.length, dispatch]);

  React.useEffect(() => {
    dispatch(loadOrdersForUserThunk("u1"));
  }, [dispatch]);

  const startEdit = (p: Product) => {
    setEditing(p);
    reset({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      stock: p.stock,
      imageUrl: p.images[0] || "",
      description: p.description
    });
  };

  const startNew = () => {
    setEditing(null);
    reset({
      id: undefined,
      name: "",
      price: 0,
      category: "Electronics",
      stock: 0,
      imageUrl: "",
      description: ""
    });
  };

  const onSubmit = (data: ProductForm) => {
    const id = data.id || newId();
    const existing = products.find((p) => p.id === id);

    const next: Product = {
      id,
      name: data.name,
      price: Number(data.price),
      category: data.category,
      stock: Number(data.stock),
      images: [data.imageUrl || existing?.images[0] || "https://picsum.photos/seed/product/1200/800"],
      rating: existing?.rating ?? 4.2,
      ratingCount: existing?.ratingCount ?? 10,
      description: data.description,
      specs: existing?.specs ?? { Brand: "Mock", Warranty: "1 year" },
      reviews: existing?.reviews ?? [],
      featured: existing?.featured ?? false
    };

    dispatch(upsertProductThunk(next));
    toast.success(editing ? "Product updated." : "Product created.");
    startNew();
  };

  const inventoryLow = products.filter((p) => p.stock <= 10).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h1 className="h3 m-0">Admin Dashboard</h1>
        <Badge bg={inventoryLow > 0 ? "warning" : "success"} text={inventoryLow > 0 ? "dark" : undefined}>
          {inventoryLow} low-stock items
        </Badge>
      </div>

      {isLoading && products.length === 0 ? <LoadingSpinner label="Loading admin data..." /> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <Tabs defaultActiveKey="products" className="mb-3">
        <Tab eventKey="products" title="Products">
          <Row className="g-4">
            <Col lg={7}>
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <Card.Title className="mb-0">Product list</Card.Title>
                    <Button variant="outline-primary" size="sm" onClick={startNew}>
                      New product
                    </Button>
                  </div>
                  <Table responsive hover className="mt-3" aria-label="Admin product table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th className="text-end">Price</th>
                        <th className="text-end">Stock</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td className="fw-semibold">{p.name}</td>
                          <td>{p.category}</td>
                          <td className="text-end">{fmt(p.price)}</td>
                          <td className="text-end">
                            <Badge bg={p.stock <= 10 ? "warning" : "secondary"} text={p.stock <= 10 ? "dark" : undefined}>
                              {p.stock}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-2">
                              <Button variant="outline-primary" size="sm" onClick={() => startEdit(p)}>
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  dispatch(deleteProductThunk(p.id));
                                  toast.info("Product deleted.");
                                }}
                                aria-label={`Delete ${p.name}`}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>{editing ? "Edit product" : "Create product"}</Card.Title>
                  <Form onSubmit={handleSubmit(onSubmit)} aria-label="Product editor form">
                    <Form.Control type="hidden" {...register("id")} />
                    <Form.Group className="mb-3" controlId="prodName">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        aria-invalid={Boolean(errors.name)}
                        {...register("name", { required: "Name is required" })}
                      />
                      {errors.name ? <div className="text-danger small mt-1">{errors.name.message}</div> : null}
                    </Form.Group>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="prodPrice">
                          <Form.Label>Price</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            aria-invalid={Boolean(errors.price)}
                            {...register("price", { required: "Price is required", valueAsNumber: true, min: 0 })}
                          />
                          {errors.price ? <div className="text-danger small mt-1">{errors.price.message}</div> : null}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="prodStock">
                          <Form.Label>Stock</Form.Label>
                          <Form.Control
                            type="number"
                            aria-invalid={Boolean(errors.stock)}
                            {...register("stock", { required: "Stock is required", valueAsNumber: true, min: 0 })}
                          />
                          {errors.stock ? <div className="text-danger small mt-1">{errors.stock.message}</div> : null}
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3" controlId="prodCategory">
                      <Form.Label>Category</Form.Label>
                      <Form.Select {...register("category", { required: true })} aria-label="Category">
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="prodImage">
                      <Form.Label>Image URL</Form.Label>
                      <Form.Control
                        placeholder="https://images.unsplash.com/..."
                        {...register("imageUrl")}
                      />
                      <div className="small text-muted mt-1">
                        Leave blank to keep existing image (or use a placeholder).
                      </div>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="prodDesc">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        aria-invalid={Boolean(errors.description)}
                        {...register("description", { required: "Description is required" })}
                      />
                      {errors.description ? (
                        <div className="text-danger small mt-1">{errors.description.message}</div>
                      ) : null}
                    </Form.Group>
                    <div className="d-grid gap-2">
                      <Button type="submit" variant="primary">
                        {editing ? "Save changes" : "Create product"}
                      </Button>
                      {editing ? (
                        <Button variant="outline-secondary" onClick={startNew}>
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="orders" title="Orders">
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">Orders</Card.Title>
                <div className="small text-muted">{orders.length} total</div>
              </div>
              <Table responsive hover className="mt-3" aria-label="Admin orders table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Items</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="fw-semibold">#{o.id}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="text-capitalize">
                        <Badge bg={o.status === "pending" ? "warning" : "success"} text={o.status === "pending" ? "dark" : undefined}>
                          {o.status}
                        </Badge>
                      </td>
                      <td className="text-end">{o.items.reduce((s, it) => s + it.qty, 0)}</td>
                      <td className="text-end">
                        {o.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => {
                              dispatch(updateOrderStatusThunk({ orderId: o.id, status: "shipped" }));
                              toast.success("Order marked shipped.");
                            }}
                          >
                            Mark shipped
                          </Button>
                        ) : (
                          <span className="text-muted small">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="inventory" title="Inventory">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Inventory view</Card.Title>
              <div className="text-muted">
                Low stock items are highlighted to help you restock quickly.
              </div>
              <Table responsive hover className="mt-3" aria-label="Inventory table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="text-end">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .slice()
                    .sort((a, b) => a.stock - b.stock)
                    .map((p) => (
                      <tr key={p.id}>
                        <td className="fw-semibold">{p.name}</td>
                        <td>{p.category}</td>
                        <td className="text-end">
                          <Badge bg={p.stock <= 10 ? "warning" : "secondary"} text={p.stock <= 10 ? "dark" : undefined}>
                            {p.stock}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};
