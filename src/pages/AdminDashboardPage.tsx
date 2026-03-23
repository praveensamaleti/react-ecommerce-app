import React from "react";
import {
  Button, Card, Col, Form, InputGroup,
  Pagination, Row, Table, Tabs, Tab, Badge, Modal,
} from "react-bootstrap";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import { Search, Plus, Trash2 } from "lucide-react";
import type { Product, ProductVariant } from "../types/domain";
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
import api from "../utils/api";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

type ProductForm = {
  id?: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  description: string;
};

type VariantForm = {
  sku: string;
  stock: number;
  price: string; // empty string = use parent price
  attributes: { key: string; value: string }[];
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const PAGE_SIZE = 10;

const stockVariant = (n: number): "danger" | "warning" | "success" => {
  if (n < 10) return "danger";
  if (n <= 30) return "warning";
  return "success";
};

// ------------------------------------------------------------------
// Variant Manager Modal
// Encapsulates all variant CRUD for a single product.
// ------------------------------------------------------------------

const VariantManagerModal: React.FC<{
  product: Product;
  onClose: () => void;
  onProductUpdated: () => void;
}> = ({ product, onClose, onProductUpdated }) => {
  const fmt = useCurrencyFormatter();
  const [variants, setVariants] = React.useState<ProductVariant[]>(product.variants ?? []);
  const [saving, setSaving] = React.useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } =
    useForm<VariantForm>({
      defaultValues: {
        sku: "",
        stock: 0,
        price: "",
        attributes: [{ key: "", value: "" }],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "attributes" });

  const onAddVariant = async (data: VariantForm) => {
    setSaving(true);
    try {
      const attrsMap: Record<string, string> = {};
      data.attributes.forEach(({ key, value }) => {
        if (key.trim()) attrsMap[key.trim()] = value.trim();
      });

      const payload = {
        sku: data.sku || undefined,
        stock: Number(data.stock),
        price: data.price ? Number(data.price) : undefined,
        attributes: attrsMap,
      };

      const response = await api.post<ProductVariant>(
        `/api/products/${product.id}/variants`,
        payload
      );
      setVariants((prev) => [...prev, response.data]);
      reset({ sku: "", stock: 0, price: "", attributes: [{ key: "", value: "" }] });
      toast.success("Variant added.");
      onProductUpdated();
    } catch {
      toast.error("Failed to add variant.");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteVariant = async (variantId: string) => {
    try {
      await api.delete(`/api/products/${product.id}/variants/${variantId}`);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      toast.info("Variant deleted.");
      onProductUpdated();
    } catch {
      toast.error("Failed to delete variant.");
    }
  };

  return (
    <Modal show onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Variants — {product.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Existing variants table */}
        {variants.length > 0 ? (
          <Table size="sm" responsive className="mb-4 table-modern">
            <thead>
              <tr>
                <th>Label</th>
                <th>SKU</th>
                <th className="text-end">Stock</th>
                <th className="text-end">Price</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td className="fw-semibold">{v.label || "—"}</td>
                  <td className="text-muted small">{v.sku || "—"}</td>
                  <td className="text-end">
                    <Badge bg={stockVariant(v.stock)}>{v.stock}</Badge>
                  </td>
                  <td className="text-end">
                    {v.price != null ? fmt(v.price) : <span className="text-muted">Base</span>}
                  </td>
                  <td className="text-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onDeleteVariant(v.id)}
                      aria-label={`Delete variant ${v.label}`}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="text-muted mb-4">No variants yet. Add one below.</p>
        )}

        {/* Add variant form */}
        <h6 className="fw-bold mb-3">Add Variant</h6>
        <Form onSubmit={handleSubmit(onAddVariant)}>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>SKU (optional)</Form.Label>
                <Form.Control placeholder="SHIRT-RED-M" {...register("sku")} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  aria-invalid={Boolean(errors.stock)}
                  {...register("stock", { required: "Required", valueAsNumber: true, min: 0 })}
                />
                {errors.stock && <div className="text-danger small mt-1">{errors.stock.message}</div>}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Price override (leave blank to use product price)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="e.g. 34.99"
                  {...register("price")}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Dynamic attribute rows */}
          <div className="mt-3 mb-2 fw-semibold small">Attributes (e.g. color=Red, size=M)</div>
          {fields.map((field, idx) => (
            <Row key={field.id} className="g-2 mb-2">
              <Col xs={5}>
                <Form.Control
                  placeholder="Key (e.g. color)"
                  {...register(`attributes.${idx}.key`)}
                />
              </Col>
              <Col xs={5}>
                <Form.Control
                  placeholder="Value (e.g. Red)"
                  {...register(`attributes.${idx}.value`)}
                />
              </Col>
              <Col xs={2}>
                {fields.length > 1 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => remove(idx)}
                    aria-label="Remove attribute row"
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </Col>
            </Row>
          ))}

          <Button
            variant="outline-secondary"
            size="sm"
            className="mb-3"
            type="button"
            onClick={() => append({ key: "", value: "" })}
          >
            <Plus size={13} className="me-1" /> Add attribute
          </Button>

          <div className="d-grid">
            <Button type="submit" variant="success" disabled={saving}>
              {saving ? "Adding…" : "Add variant"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

// ------------------------------------------------------------------
// AdminDashboardPage
// ------------------------------------------------------------------

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
  const [variantProduct, setVariantProduct] = React.useState<Product | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<ProductForm>({
      defaultValues: {
        name: "", price: 0, category: "Electronics",
        stock: 0, imageUrl: "", description: "",
      },
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

  // Products tab pagination
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pageProducts = filteredProducts.slice(
    productPage * PAGE_SIZE, (productPage + 1) * PAGE_SIZE
  );

  // Inventory tab
  const sortedInventory = products.slice().sort((a, b) => a.stock - b.stock);
  const filteredInventory = sortedInventory.filter((p) =>
    p.name.toLowerCase().includes(inventorySearch.toLowerCase())
  );
  const totalInventoryPages = Math.max(1, Math.ceil(filteredInventory.length / PAGE_SIZE));
  const pageInventory = filteredInventory.slice(
    inventoryPage * PAGE_SIZE, (inventoryPage + 1) * PAGE_SIZE
  );

  const startEdit = (p: Product) => {
    setEditing(p);
    reset({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      stock: p.stock,
      imageUrl: p.images[0] || "",
      description: p.description,
    });
  };

  const startNew = () => {
    setEditing(null);
    reset({
      id: undefined, name: "", price: 0,
      category: categories[0] ?? "Electronics",
      stock: 0, imageUrl: "", description: "",
    });
  };

  const onSubmit = (data: ProductForm) => {
    const existing = products.find((p) => p.id === data.id);
    const next: Product = {
      id: data.id || "",
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
      variants: existing?.variants ?? [],
      featured: existing?.featured ?? false,
    };
    dispatch(upsertProductThunk(next));
    toast.success(editing ? "Product updated." : "Product created.");
    startNew();
  };

  const inventoryLow = products.filter((p) => p.stock <= 10).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h1 className="h3 m-0 page-title">Admin Dashboard</h1>
        <span
          style={{
            background: inventoryLow > 0
              ? "linear-gradient(135deg, #f59e0b, #d97706)"
              : "linear-gradient(135deg, #10b981, #059669)",
            color: "white", borderRadius: 20, padding: "4px 14px",
            fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em",
          }}
        >
          {inventoryLow} low-stock items
        </span>
      </div>

      {isLoading && products.length === 0
        ? <LoadingSpinner label="Loading admin data..." />
        : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <Tabs defaultActiveKey="products" className="mb-3">

        {/* ======================== PRODUCTS TAB ======================== */}
        <Tab eventKey="products" title="Products">
          <Row className="g-4">
            <Col lg={7}>
              <Card className="admin-card shadow-sm">
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
                      onChange={(e) => { setProductSearch(e.target.value); setProductPage(0); }}
                    />
                  </InputGroup>
                  <Table responsive hover className="mt-0 table-modern" aria-label="Admin product table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th className="text-end">Price</th>
                        <th className="text-end">Stock</th>
                        <th className="text-end">Variants</th>
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
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => setVariantProduct(p)}
                              aria-label={`Manage variants for ${p.name}`}
                            >
                              {(p.variants?.length ?? 0) > 0
                                ? `${p.variants.length} variants`
                                : "+ Variants"}
                            </Button>
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
                            key={i} active={i === productPage}
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
              <Card className="admin-card shadow-sm">
                <Card.Body>
                  <Card.Title className="fw-bold">{editing ? "Edit product" : "Create product"}</Card.Title>
                  <Form onSubmit={handleSubmit(onSubmit)} aria-label="Product editor form">
                    <Form.Control type="hidden" {...register("id")} />
                    <Form.Group className="mb-3" controlId="prodName">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        aria-invalid={Boolean(errors.name)}
                        {...register("name", { required: "Name is required" })}
                      />
                      {errors.name && <div className="text-danger small mt-1">{errors.name.message}</div>}
                    </Form.Group>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="prodPrice">
                          <Form.Label>Price</Form.Label>
                          <Form.Control
                            type="number" step="0.01"
                            aria-invalid={Boolean(errors.price)}
                            {...register("price", { required: "Required", valueAsNumber: true, min: 0 })}
                          />
                          {errors.price && <div className="text-danger small mt-1">{errors.price.message}</div>}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="prodStock">
                          <Form.Label>Base stock</Form.Label>
                          <Form.Control
                            type="number"
                            aria-invalid={Boolean(errors.stock)}
                            {...register("stock", { required: "Required", valueAsNumber: true, min: 0 })}
                          />
                          {errors.stock && <div className="text-danger small mt-1">{errors.stock.message}</div>}
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
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="prodDesc">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea" rows={3}
                        aria-invalid={Boolean(errors.description)}
                        {...register("description", { required: "Description is required" })}
                      />
                      {errors.description && <div className="text-danger small mt-1">{errors.description.message}</div>}
                    </Form.Group>
                    <div className="d-grid gap-2">
                      <Button type="submit" variant="primary">
                        {editing ? "Save changes" : "Create product"}
                      </Button>
                      {editing && (
                        <Button variant="outline-secondary" onClick={startNew}>Cancel</Button>
                      )}
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* ======================== ORDERS TAB ======================== */}
        <Tab eventKey="orders" title="Orders">
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">Orders</Card.Title>
                <div className="small text-muted">{orders.length} total</div>
              </div>
              <Table responsive hover className="mt-3 table-modern" aria-label="Admin orders table">
                <thead>
                  <tr>
                    <th>Order</th><th>Date</th><th>Status</th>
                    <th className="text-end">Items</th><th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="fw-semibold">#{o.id}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="text-capitalize">
                        <Badge bg={o.status === "pending" ? "warning" : "success"}
                               text={o.status === "pending" ? "dark" : undefined}>
                          {o.status}
                        </Badge>
                      </td>
                      <td className="text-end">{o.items.reduce((s, it) => s + it.qty, 0)}</td>
                      <td className="text-end">
                        {o.status === "pending" ? (
                          <Button
                            size="sm" variant="outline-success"
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

        {/* ======================== INVENTORY TAB ======================== */}
        <Tab eventKey="inventory" title="Inventory">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Inventory view</Card.Title>
              <div className="text-muted mb-3">
                Low-stock items are highlighted. Products with variants show per-variant stock in their detail page.
              </div>
              <InputGroup className="mb-3">
                <InputGroup.Text aria-hidden="true"><Search size={14} /></InputGroup.Text>
                <Form.Control
                  placeholder="Search inventory..."
                  aria-label="Search inventory"
                  value={inventorySearch}
                  onChange={(e) => { setInventorySearch(e.target.value); setInventoryPage(0); }}
                />
              </InputGroup>
              <Table responsive hover className="table-modern" aria-label="Inventory table">
                <thead>
                  <tr>
                    <th>Product</th><th>Category</th>
                    <th className="text-end">Stock</th>
                    <th className="text-end">Variants</th>
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
                      <td className="text-end text-muted small">
                        {(p.variants?.length ?? 0) > 0 ? `${p.variants.length} variants` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalInventoryPages > 1 && (
                <div className="d-flex justify-content-center mt-2">
                  <Pagination size="sm" aria-label="Inventory pagination">
                    <Pagination.Prev
                      onClick={() => setInventoryPage((p) => Math.max(0, p - 1))}
                      disabled={inventoryPage === 0}
                    />
                    {Array.from({ length: totalInventoryPages }).map((_, i) => (
                      <Pagination.Item key={i} active={i === inventoryPage}
                                       onClick={() => setInventoryPage(i)}>
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      onClick={() => setInventoryPage((p) => Math.min(totalInventoryPages - 1, p + 1))}
                      disabled={inventoryPage >= totalInventoryPages - 1}
                    />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Variant Manager Modal */}
      {variantProduct && (
        <VariantManagerModal
          product={variantProduct}
          onClose={() => setVariantProduct(null)}
          onProductUpdated={() => dispatch(loadProductsThunk())}
        />
      )}
    </div>
  );
};
