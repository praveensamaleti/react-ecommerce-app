import { useProductsStore, selectFilteredProducts } from './productsStore';
import api from '../utils/api';

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockProduct = {
  id: 'p1',
  name: 'Widget',
  price: 99,
  images: ['img.jpg'],
  category: 'Electronics' as const,
  stock: 10,
  rating: 4,
  ratingCount: 5,
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

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  useProductsStore.setState({
    products: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    filters: { ...defaultFilters },
  });
  jest.clearAllMocks();
});

describe('loadProducts', () => {
  it('success sets products and totalCount', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { products: [mockProduct], totalCount: 1 } });

    await useProductsStore.getState().loadProducts();

    const s = useProductsStore.getState();
    expect(s.products).toEqual([mockProduct]);
    expect(s.totalCount).toBe(1);
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });

  it('failure sets error', async () => {
    mockApi.get.mockRejectedValueOnce({ response: { data: { message: 'Server error' } } });

    await useProductsStore.getState().loadProducts();

    expect(useProductsStore.getState().error).toBe('Server error');
    expect(useProductsStore.getState().isLoading).toBe(false);
  });

  it('uses fallback error message when no response data', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network'));

    await useProductsStore.getState().loadProducts();

    expect(useProductsStore.getState().error).toBe('Failed to load products.');
  });
});

describe('setQuery', () => {
  it('updates filters.query and resets page to 0', async () => {
    mockApi.get.mockResolvedValue({ data: { products: [], totalCount: 0 } });
    useProductsStore.setState({ filters: { ...defaultFilters, page: 2 } });

    useProductsStore.getState().setQuery('laptop');
    await flushPromises();

    expect(useProductsStore.getState().filters.query).toBe('laptop');
    expect(useProductsStore.getState().filters.page).toBe(0);
    expect(mockApi.get).toHaveBeenCalled();
  });
});

describe('setCategory', () => {
  it('updates category and calls loadProducts', async () => {
    mockApi.get.mockResolvedValue({ data: { products: [], totalCount: 0 } });

    useProductsStore.getState().setCategory('Electronics');
    await flushPromises();

    expect(useProductsStore.getState().filters.category).toBe('Electronics');
    expect(mockApi.get).toHaveBeenCalled();
  });

  it('sends undefined category param when "All" is selected', async () => {
    mockApi.get.mockResolvedValue({ data: { products: [], totalCount: 0 } });

    useProductsStore.getState().setCategory('All');
    await flushPromises();

    expect(mockApi.get).toHaveBeenCalledWith('/api/products', expect.objectContaining({
      params: expect.objectContaining({ category: undefined }),
    }));
  });
});

describe('setPriceRange', () => {
  it('updates minPrice and maxPrice, resets page', async () => {
    mockApi.get.mockResolvedValue({ data: { products: [], totalCount: 0 } });
    useProductsStore.setState({ filters: { ...defaultFilters, page: 3 } });

    useProductsStore.getState().setPriceRange(10, 500);
    await flushPromises();

    const f = useProductsStore.getState().filters;
    expect(f.minPrice).toBe(10);
    expect(f.maxPrice).toBe(500);
    expect(f.page).toBe(0);
  });
});

describe('setPage', () => {
  it('updates page and calls loadProducts', async () => {
    mockApi.get.mockResolvedValue({ data: { products: [], totalCount: 0 } });

    useProductsStore.getState().setPage(2);
    await flushPromises();

    expect(useProductsStore.getState().filters.page).toBe(2);
    expect(mockApi.get).toHaveBeenCalled();
  });
});

describe('setPageSize', () => {
  it('updates pageSize and resets page to 0', async () => {
    mockApi.get.mockResolvedValue({ data: { products: [], totalCount: 0 } });
    useProductsStore.setState({ filters: { ...defaultFilters, page: 2 } });

    useProductsStore.getState().setPageSize(16);
    await flushPromises();

    const f = useProductsStore.getState().filters;
    expect(f.pageSize).toBe(16);
    expect(f.page).toBe(0);
  });
});

describe('resetFilters', () => {
  it('restores default filters and calls loadProducts', async () => {
    mockApi.get.mockResolvedValue({ data: { products: [], totalCount: 0 } });
    useProductsStore.setState({ filters: { query: 'laptop', category: 'Electronics', minPrice: 10, maxPrice: 500, page: 3, pageSize: 16 } });

    useProductsStore.getState().resetFilters();
    await flushPromises();

    expect(useProductsStore.getState().filters).toEqual(defaultFilters);
    expect(mockApi.get).toHaveBeenCalled();
  });
});

describe('upsertProduct', () => {
  it('creates a new product via POST and prepends to list', async () => {
    const newProduct = { ...mockProduct, id: 'p99' };
    mockApi.post.mockResolvedValueOnce({ data: newProduct });
    useProductsStore.setState({ products: [mockProduct] });

    await useProductsStore.getState().upsertProduct({ ...newProduct, id: '' } as any);

    const products = useProductsStore.getState().products;
    expect(products[0].id).toBe('p99');
    expect(products).toHaveLength(2);
  });

  it('updates an existing product via PUT', async () => {
    const updated = { ...mockProduct, name: 'Updated Widget' };
    mockApi.put.mockResolvedValueOnce({ data: updated });
    useProductsStore.setState({ products: [mockProduct] });

    await useProductsStore.getState().upsertProduct(updated);

    expect(useProductsStore.getState().products[0].name).toBe('Updated Widget');
  });

  it('sets error on failure', async () => {
    mockApi.post.mockRejectedValueOnce({ response: { data: { message: 'Save failed' } } });

    await useProductsStore.getState().upsertProduct({ ...mockProduct, id: '' } as any);

    expect(useProductsStore.getState().error).toBe('Save failed');
  });
});

describe('deleteProduct', () => {
  it('removes product from list', async () => {
    mockApi.delete.mockResolvedValueOnce({});
    useProductsStore.setState({ products: [mockProduct] });

    await useProductsStore.getState().deleteProduct('p1');

    expect(useProductsStore.getState().products).toHaveLength(0);
  });

  it('sets error on failure', async () => {
    mockApi.delete.mockRejectedValueOnce({ response: { data: { message: 'Delete failed' } } });

    await useProductsStore.getState().deleteProduct('p1');

    expect(useProductsStore.getState().error).toBe('Delete failed');
  });
});

describe('selectFilteredProducts', () => {
  it('returns state.products as-is', () => {
    const state = { products: [mockProduct], totalCount: 1, isLoading: false, error: null, filters: defaultFilters };
    expect(selectFilteredProducts(state)).toBe(state.products);
  });
});
