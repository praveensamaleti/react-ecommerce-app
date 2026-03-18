import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductsPage } from './ProductsPage';
import { useProductsStore } from '../stores/productsStore';
import { useCartStore } from '../stores/cartStore';
import { useCartAutoTotals } from '../hooks/useCartAutoTotals';
import { useDebounce } from '../hooks/useDebounce';

jest.mock('../stores/productsStore');
jest.mock('../stores/cartStore');
jest.mock('../hooks/useCartAutoTotals');
jest.mock('../hooks/useDebounce', () => ({ useDebounce: jest.fn((v: any) => v) }));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockLoadProducts = jest.fn();
const mockSetQuery = jest.fn();
const mockSetCategory = jest.fn();
const mockSetPriceRange = jest.fn();
const mockSetPage = jest.fn();
const mockSetPageSize = jest.fn();
const mockResetFilters = jest.fn();
const mockAddToCart = jest.fn();

const sampleProduct = {
  id: 'p1',
  name: 'Sample Widget',
  price: 49.99,
  images: ['img.jpg'],
  category: 'Electronics' as const,
  stock: 5,
  rating: 4,
  ratingCount: 3,
  description: 'desc',
  specs: {},
  reviews: [],
};

const defaultFilters = {
  query: '',
  category: 'All' as const,
  minPrice: 0,
  maxPrice: 1000,
  page: 0,
  pageSize: 8,
};

const makeProductsState = (overrides: any = {}) => {
  (useProductsStore as jest.Mock).mockImplementation((selector: any) => {
    const state = {
      products: [sampleProduct],
      totalCount: 1,
      isLoading: false,
      error: null,
      filters: defaultFilters,
      loadProducts: mockLoadProducts,
      setQuery: mockSetQuery,
      setCategory: mockSetCategory,
      setPriceRange: mockSetPriceRange,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
      resetFilters: mockResetFilters,
      ...overrides,
    };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
  makeProductsState();
  (useCartStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { addToCart: mockAddToCart };
    return typeof selector === 'function' ? selector(state) : state;
  });
});

const wrap = () => render(<MemoryRouter><ProductsPage /></MemoryRouter>);

describe('ProductsPage', () => {
  it('renders search input', () => {
    wrap();
    expect(screen.getByRole('textbox', { name: /search products/i })).toBeInTheDocument();
  });

  it('renders category filter select', () => {
    wrap();
    expect(screen.getByRole('combobox', { name: /filter by category/i })).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading=true', () => {
    makeProductsState({ isLoading: true, products: [] });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows EmptyState when products=[] and not loading', () => {
    makeProductsState({ products: [], totalCount: 0 });
    wrap();
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('shows product cards for each product', () => {
    wrap();
    expect(screen.getByText('Sample Widget')).toBeInTheDocument();
  });

  it('category select change calls setCategory', () => {
    wrap();
    fireEvent.change(screen.getByRole('combobox', { name: /filter by category/i }), {
      target: { value: 'Electronics' },
    });
    expect(mockSetCategory).toHaveBeenCalledWith('Electronics');
  });

  it('page size change calls setPageSize', () => {
    wrap();
    fireEvent.change(screen.getByRole('combobox', { name: /page size/i }), {
      target: { value: '16' },
    });
    expect(mockSetPageSize).toHaveBeenCalledWith(16);
  });

  it('reset button calls resetFilters', () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(mockResetFilters).toHaveBeenCalledTimes(1);
  });

  it('Prev pagination button is disabled when page=0', () => {
    makeProductsState({ totalCount: 20, filters: { ...defaultFilters, pageSize: 8, page: 0 } });
    const { container } = wrap();
    const prevItem = container.querySelector('.pagination .page-item:first-child');
    expect(prevItem).toHaveClass('disabled');
  });

  it('Prev button calls setPage when not on first page', () => {
    makeProductsState({
      totalCount: 20,
      filters: { ...defaultFilters, pageSize: 8, page: 1 },
    });
    const { container } = wrap();
    const prevItem = container.querySelector('.pagination .page-item:first-child');
    fireEvent.click(prevItem!.querySelector('a')!);
    expect(mockSetPage).toHaveBeenCalledWith(0);
  });

  it('Next button calls setPage', () => {
    makeProductsState({
      totalCount: 20,
      filters: { ...defaultFilters, pageSize: 8, page: 0 },
    });
    const { container } = wrap();
    const nextItem = container.querySelector('.pagination .page-item:last-child');
    fireEvent.click(nextItem!.querySelector('a')!);
    expect(mockSetPage).toHaveBeenCalledWith(1);
  });
});
