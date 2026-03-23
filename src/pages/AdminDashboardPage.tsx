import React from "react";
import { Button, Card, Col, Form, InputGroup, Pagination, Row, Table, Tabs, Tab, Badge } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import type { Product } from "../types/domain";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loadProductsThunk,
  loadCategoriesThunk,
  upsertProductThunk,
  deleteProductThunk,
  selectCategories,
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
  category: string;
  stock: number;
  imageUrl: string;
  description: string;
};

const newId = () => `p${Math.floor(Math.random() * 90000) + 10000}`;

const PAGE_SIZE = 10;

const stockVariant = (n: number): "danger" | "warning" | "success" => {
  if (n < 10) return "danger";
  if (n <= 30) return "warning";
  return "success";
};

export const AdminDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((s) => s.products.products);
  const isLoading = useAppSelector((s) => s.products.isLoading);
  const error = useAppSelector((s) => s.products.error);
  const orders = useAppSelector((s) => s.orders.orders);
  const categories = useAppSelector(selectCategories);

  const fmt = useCurrencyFormatter();
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [productSearch, setProductSearch] = React.useState("");
  const [productPage, setProductPage] = React.useState(0);
  const [inventorySearch, setInventorySearch] = React.useState("");
  const [inventoryPage, setInventoryPage] = React.useState(0);

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

  React.useEffect(() => {
    if (categories.length === 0) dispatch(loadCategoriesThunk());
  }, [categories.length, dispatch]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pageProducts = filteredProducts.slice(productPage * PAGE_SIZE, (productPage + 1) * PAGE_SIZE);

  const sortedInventory = products.slice().sort((a, b) => a.stock - b.stock);
  const filteredInventory = sortedInventory.filter((p) =>
    p.name.toLowerCase().includes(inventorySearch.toLowerCase())
  );
  const totalInventoryPages = Math.max(1, Math.ceil(filteredInventory.length / PAGE_SIZE));
  const pageInventory = filteredInventory.slice(inventoryPage * PAGE_SIZE, (inventoryPage + 1) * PAGE_SIZE);

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
      category: categories[0] ?? "Electronics",
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
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Card.Title className="mb-0">Product list</Card.Title>
                    <Button variant="outline-primary" size="sm" onClick={startNew}>
                      New product
                    </Button>
                  </div>
                  <InputGroup className="mb-3">
                    <InputGroup.Text aria-hidden="true"><Search size={14} /></InputGroup.Text>
                    <Form.Control
                      placeholder="Search products..."
                      aria-label="Search products"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPage(0);
                      }}
                    />
                  </InputGroup>
                  <Table responsive hover className="mt-0" aria-label="Admin product table">
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
                      {pageProducts.map((p) => (
                        <tr key={p.id}>
                          <td className="fw-semibold">{p.name}</td>
                          <td>{p.category}</td>
                          <td className="text-end">{fmt(p.price)}</td>
                          <td className="text-end">
                            <Badge
                              bg={stockVariant(p.stock)}
                              text={stockVariant(p.stock) === "warning" ? "dark" : undefined}
                            >
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
                  {totalProductPages > 1 ? (
                    <div className="d-flex justify-content-center mt-2">
                      <Pagination size="sm" aria-label="Products pagination">
                        <Pagination.Prev
                          onClick={() => setProductPage((p) => Math.max(0, p - 1))}
                          disabled={productPage === 0}
                        />
                        {Array.from({ length: totalProductPages }).map((_, i) => (
                          <Pagination.Item
                            key={i}
                            active={i === productPage}
                            onClick={() => setProductPage(i)}
                          >
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next
                          onClick={() => setProductPage((p) => Math.min(totalProductPages - 1, p + 1))}
                          disabled={productPage >= totalProductPages - 1}
                        />
                      </Pagination>
                    </div>
                  ) : null}
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
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
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
              <div className="text-muted mb-3">
                Low stock items are highlighted to help you restock quickly.
              </div>
              <InputGroup className="mb-3">
                <InputGroup.Text aria-hidden="true"><Search size={14} /></InputGroup.Text>
                <Form.Control
                  placeholder="Search inventory..."
                  aria-label="Search inventory"
                  value={inventorySearch}
                  onChange={(e) => {
                    setInventorySearch(e.target.value);
                    setInventoryPage(0);
                  }}
                />
              </InputGroup>
              <Table responsive hover aria-label="Inventory table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="text-end">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {pageInventory.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.name}</td>
                      <td>{p.category}</td>
                      <td className="text-end">
                        <Badge
                          bg={stockVariant(p.stock)}
                          text={stockVariant(p.stock) === "warning" ? "dark" : undefined}
                        >
                          {p.stock}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalInventoryPages > 1 ? (
                <div className="d-flex justify-content-center mt-2">
                  <Pagination size="sm" aria-label="Inventory pagination">
                    <Pagination.Prev
                      onClick={() => setInventoryPage((p) => Math.max(0, p - 1))}
                      disabled={inventoryPage === 0}
                    />
                    {Array.from({ length: totalInventoryPages }).map((_, i) => (
                      <Pagination.Item
                        key={i}
                        active={i === inventoryPage}
                        onClick={() => setInventoryPage(i)}
                      >
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      onClick={() => setInventoryPage((p) => Math.min(totalInventoryPages - 1, p + 1))}
                      disabled={inventoryPage >= totalInventoryPages - 1}
                    />
                  </Pagination>
                </div>
              ) : null}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};
