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
import type { Product } from "../types/domain";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loadProductsThunk,
  loadCategoriesThunk,
  setFiltersQuery,
  setFiltersCategory,
  setFiltersPriceRange,
  setFiltersPage,
  setFiltersPageSize,
  resetFilters,
  selectCategories,
} from "../store/slices/productsSlice";
import { addToCartThunk, removeFromCartThunk, setQtyThunk } from "../store/slices/cartSlice";
import { useDebounce } from "../hooks/useDebounce";
import { useCartAutoTotals } from "../hooks/useCartAutoTotals";

export const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((s) => s.products.products);
  const totalCount = useAppSelector((s) => s.products.totalCount);
  const isLoading = useAppSelector((s) => s.products.isLoading);
  const error = useAppSelector((s) => s.products.error);
  const filters = useAppSelector((s) => s.products.filters);
  const categories = useAppSelector(selectCategories);
  const cartItems = useAppSelector((s) => s.cart.items);
  useCartAutoTotals();

  const cartMap = React.useMemo(
    () => new Map(cartItems.map((i) => [i.productId, i.qty])),
    [cartItems]
  );

  const [searchInput, setSearchInput] = React.useState(filters.query);
  const debouncedSearch = useDebounce(searchInput, 250);
  const [priceInput, setPriceInput] = React.useState(filters.maxPrice);
  const debouncedPrice = useDebounce(priceInput, 400);
  const [quick, setQuick] = React.useState<Product | null>(null);
  const [showQuick, setShowQuick] = React.useState(false);

  React.useEffect(() => {
    if (products.length === 0) dispatch(loadProductsThunk());
  }, [products.length, dispatch]);

  React.useEffect(() => {
    if (categories.length === 0) dispatch(loadCategoriesThunk());
  }, [categories.length, dispatch]);

  React.useEffect(() => {
    dispatch(setFiltersQuery(debouncedSearch));
    dispatch(loadProductsThunk());
  }, [debouncedSearch, dispatch]);

  React.useEffect(() => {
    dispatch(setFiltersPriceRange({ minPrice: 0, maxPrice: debouncedPrice }));
    dispatch(loadProductsThunk());
  }, [debouncedPrice, dispatch]);

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));
  const pageItems = products;

  const onAdd = (id: string, qty = 1) => {
    dispatch(addToCartThunk({ productId: id, qty }));
    toast.success("Added to cart.");
  };

  const onRemove = (id: string) => {
    dispatch(removeFromCartThunk(id));
  };

  const onQty = (id: string, qty: number) => {
    dispatch(setQtyThunk({ productId: id, qty }));
  };

  const onQuick = (p: Product) => {
    setQuick(p);
    setShowQuick(true);
  };

  const PRICE_MAX = 1000;

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 className="h3 m-0">Products</h1>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="light" text="dark" className="border">
            {totalCount} results
          </Badge>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => {
              dispatch(resetFilters());
              dispatch(loadProductsThunk());
              setPriceInput(PRICE_MAX);
              setSearchInput("");
            }}
          >
            <SlidersHorizontal size={16} className="me-2" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>

      <Row className="g-3">
        <Col lg={3}>
          <div className="rounded-3 shadow-sm p-3 bg-body-tertiary">
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
              onChange={(e) => {
                dispatch(setFiltersCategory(e.target.value));
                dispatch(loadProductsThunk());
              }}
              aria-label="Filter by category"
            >
              {["All", ...categories].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Form.Select>

            <hr />

            <div className="fw-semibold mb-2">Price range</div>
            <Form.Label className="small text-muted">
              $0 – ${priceInput}
            </Form.Label>
            <Form.Range
              min={0}
              max={PRICE_MAX}
              value={priceInput}
              onChange={(e) => setPriceInput(Number(e.target.value))}
              aria-label="Max price"
            />

            <hr />

            <div className="fw-semibold mb-2">Page size</div>
            <Form.Select
              value={filters.pageSize}
              onChange={(e) => {
                dispatch(setFiltersPageSize(Number(e.target.value)));
                dispatch(loadProductsThunk());
              }}
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
                dispatch(resetFilters());
                dispatch(loadProductsThunk());
                setSearchInput("");
                setPriceInput(PRICE_MAX);
              }}
            />
          ) : null}

          <Row className="g-3">
            {pageItems.map((p) => (
              <Col key={p.id} xs={12} sm={6} xl={4}>
                <ProductCard
                  product={p}
                  cartQty={cartMap.get(p.id) ?? 0}
                  onAddToCart={(id) => onAdd(id)}
                  onRemoveFromCart={onRemove}
                  onQtyChange={onQty}
                  onQuickView={onQuick}
                />
              </Col>
            ))}
          </Row>

          {!isLoading && !error && products.length > 0 ? (
            <div className="d-flex justify-content-center mt-4">
              <Pagination aria-label="Pagination">
                <Pagination.Prev
                  onClick={() => {
                    dispatch(setFiltersPage(Math.max(0, filters.page - 1)));
                    dispatch(loadProductsThunk());
                  }}
                  disabled={filters.page === 0}
                />
                {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                  return (
                    <Pagination.Item
                      key={i}
                      active={i === filters.page}
                      onClick={() => {
                        dispatch(setFiltersPage(i));
                        dispatch(loadProductsThunk());
                      }}
                      aria-label={`Page ${i + 1}`}
                    >
                      {i + 1}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next
                  onClick={() => {
                    dispatch(setFiltersPage(Math.min(totalPages - 1, filters.page + 1)));
                    dispatch(loadProductsThunk());
                  }}
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
