import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductsPage } from './ProductsPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setFiltersCategory,
  setFiltersPageSize,
  setFiltersPage,
  resetFilters,
} from '../store/slices/productsSlice';
import { useCartAutoTotals } from '../hooks/useCartAutoTotals';

jest.mock('../store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock('../hooks/useCartAutoTotals');
jest.mock('../hooks/useDebounce', () => ({ useDebounce: jest.fn((v: any) => v) }));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockDispatch = jest.fn().mockResolvedValue(undefined);

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

const makeState = (overrides: any = {}) => {
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      products: {
        products: [sampleProduct],
        totalCount: 1,
        isLoading: false,
        error: null,
        filters: defaultFilters,
        ...overrides,
      },
      cart: { items: [] },
      currency: { currency: 'USD' },
    })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockResolvedValue(undefined);
  (useCartAutoTotals as jest.Mock).mockReturnValue(undefined);
  makeState();
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
    makeState({ isLoading: true, products: [] });
    wrap();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows EmptyState when products=[] and not loading', () => {
    makeState({ products: [], totalCount: 0 });
    wrap();
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('shows product cards for each product', () => {
    wrap();
    expect(screen.getByText('Sample Widget')).toBeInTheDocument();
  });

  it('category select change dispatches setFiltersCategory', () => {
    wrap();
    fireEvent.change(screen.getByRole('combobox', { name: /filter by category/i }), {
      target: { value: 'Electronics' },
    });
    expect(mockDispatch).toHaveBeenCalledWith(setFiltersCategory('Electronics' as any));
  });

  it('page size change dispatches setFiltersPageSize', () => {
    wrap();
    fireEvent.change(screen.getByRole('combobox', { name: /page size/i }), {
      target: { value: '16' },
    });
    expect(mockDispatch).toHaveBeenCalledWith(setFiltersPageSize(16));
  });

  it('reset button dispatches resetFilters', () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(mockDispatch).toHaveBeenCalledWith(resetFilters());
  });

  it('Prev pagination button is disabled when page=0', () => {
    makeState({ totalCount: 20, filters: { ...defaultFilters, pageSize: 8, page: 0 } });
    const { container } = wrap();
    const prevItem = container.querySelector('.pagination .page-item:first-child');
    expect(prevItem).toHaveClass('disabled');
  });

  it('Prev button dispatches setFiltersPage when not on first page', () => {
    makeState({
      totalCount: 20,
      filters: { ...defaultFilters, pageSize: 8, page: 1 },
    });
    const { container } = wrap();
    const prevItem = container.querySelector('.pagination .page-item:first-child');
    fireEvent.click(prevItem!.querySelector('a')!);
    expect(mockDispatch).toHaveBeenCalledWith(setFiltersPage(0));
  });

  it('Next button dispatches setFiltersPage', () => {
    makeState({
      totalCount: 20,
      filters: { ...defaultFilters, pageSize: 8, page: 0 },
    });
    const { container } = wrap();
    const nextItem = container.querySelector('.pagination .page-item:last-child');
    fireEvent.click(nextItem!.querySelector('a')!);
    expect(mockDispatch).toHaveBeenCalledWith(setFiltersPage(1));
  });
});
