import React from "react";
import {
  Row,
  Col,
  Form,
  Button,
  Pagination,
  InputGroup,
  Badge
} from "react-bootstrap";
import { Search, SlidersHorizontal } from "lucide-react";
import { toast } from "react-toastify";
import { ProductCard } from "../components/ProductCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { QuickViewModal } from "../components/QuickViewModal";
import type { Category, Product } from "../types/domain";
import {
  selectFilteredProducts,
  useProductsStore
} from "../stores/productsStore";
import { useCartStore } from "../stores/cartStore";
import { useDebounce } from "../hooks/useDebounce";
import { useCartAutoTotals } from "../hooks/useCartAutoTotals";

const categories: Array<Category | "All"> = ["All", "Electronics", "Clothing"];

export const ProductsPage: React.FC = () => {
  const {
    products,
    totalCount,
    isLoading,
    error,
    filters,
    loadProducts,
    setQuery,
    setCategory,
    setPriceRange,
    setPage,
    setPageSize,
    resetFilters
  } = useProductsStore();

  const addToCart = useCartStore((s) => s.addToCart);
  useCartAutoTotals();

  const [searchInput, setSearchInput] = React.useState(filters.query);
  const debouncedSearch = useDebounce(searchInput, 250);
  const [quick, setQuick] = React.useState<Product | null>(null);
  const [showQuick, setShowQuick] = React.useState(false);

  React.useEffect(() => {
    if (products.length === 0) loadProducts();
  }, [products.length, loadProducts]);

  React.useEffect(() => {
    setQuery(debouncedSearch);
  }, [debouncedSearch, setQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));
  const page = Math.min(filters.page, totalPages - 1);
  const pageItems = products;

  const onAdd = (id: string, qty = 1) => {
    addToCart(id, qty);
    toast.success("Added to cart.");
  };

  const onQuick = (p: Product) => {
    setQuick(p);
    setShowQuick(true);
  };

  const priceMax = Math.max(filters.maxPrice, 1);

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 className="h3 m-0">Products</h1>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="light" text="dark" className="border">
            {totalCount} results
          </Badge>
          <Button variant="outline-primary" size="sm" onClick={resetFilters}>
            <SlidersHorizontal size={16} className="me-2" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>

      <Row className="g-3">
        <Col lg={3}>
          <div className="bg-white rounded-3 shadow-sm p-3">
            <div className="fw-semibold mb-2">Search</div>
            <InputGroup>
              <InputGroup.Text aria-hidden="true">
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
              />
            </InputGroup>

            <hr />

            <div className="fw-semibold mb-2">Category</div>
            <Form.Select
              value={filters.category}
              onChange={(e) => setCategory(e.target.value as Category | "All")}
              aria-label="Filter by category"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Form.Select>

            <hr />

            <div className="fw-semibold mb-2">Price range</div>
            <Form.Label className="small text-muted">
              ${filters.minPrice} – ${filters.maxPrice}
            </Form.Label>
            <Form.Range
              min={0}
              max={priceMax}
              value={filters.maxPrice}
              onChange={(e) => setPriceRange(0, Number(e.target.value))}
              aria-label="Max price"
            />

            <hr />

            <div className="fw-semibold mb-2">Page size</div>
            <Form.Select
              value={filters.pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Page size"
            >
              {[8, 12, 16].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </Form.Select>
          </div>
        </Col>

        <Col lg={9}>
          {isLoading ? <LoadingSpinner label="Loading catalog..." /> : null}
          {error ? <div className="alert alert-danger">{error}</div> : null}

          {!isLoading && !error && products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your search or filters."
              actionLabel="Clear filters"
              onAction={() => {
                resetFilters();
                setSearchInput("");
              }}
            />
          ) : null}

          <Row className="g-3">
            {pageItems.map((p) => (
              <Col key={p.id} xs={12} sm={6} xl={4}>
                <ProductCard
                  product={p}
                  onAddToCart={(id) => onAdd(id)}
                  onQuickView={onQuick}
                />
              </Col>
            ))}
          </Row>

          {!isLoading && !error && products.length > 0 ? (
            <div className="d-flex justify-content-center mt-4">
              <Pagination aria-label="Pagination">
                <Pagination.Prev
                  onClick={() => setPage(Math.max(0, filters.page - 1))}
                  disabled={filters.page === 0}
                />
                {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                  return (
                    <Pagination.Item
                      key={i}
                      active={i === filters.page}
                      onClick={() => setPage(i)}
                      aria-label={`Page ${i + 1}`}
                    >
                      {i + 1}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next
                  onClick={() => setPage(Math.min(totalPages - 1, filters.page + 1))}
                  disabled={filters.page >= totalPages - 1}
                />
              </Pagination>
            </div>
          ) : null}
        </Col>
      </Row>

      <QuickViewModal
        product={quick}
        show={showQuick}
        onHide={() => setShowQuick(false)}
        onAddToCart={(id, qty) => {
          onAdd(id, qty);
          setShowQuick(false);
        }}
      />
    </div>
  );
};

