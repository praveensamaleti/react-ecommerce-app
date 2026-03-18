import { renderHook } from '@testing-library/react';
import { useCartAutoTotals } from './useCartAutoTotals';
import { useCartStore } from '../stores/cartStore';
import { useProductsStore } from '../stores/productsStore';

jest.mock('../stores/cartStore');
jest.mock('../stores/productsStore');

const mockRecomputeTotals = jest.fn();

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

const makeCartState = (items: any[], products: any[]) => {
  (useCartStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { items, recomputeTotals: mockRecomputeTotals };
    return typeof selector === 'function' ? selector(state) : state;
  });
  (useProductsStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { products };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useCartAutoTotals', () => {
  it('does NOT call recomputeTotals when products is empty', () => {
    makeCartState([], []);
    renderHook(() => useCartAutoTotals());
    expect(mockRecomputeTotals).not.toHaveBeenCalled();
  });

  it('calls recomputeTotals with products when products is non-empty', () => {
    makeCartState([], [mockProduct]);
    renderHook(() => useCartAutoTotals());
    expect(mockRecomputeTotals).toHaveBeenCalledWith([mockProduct]);
  });

  it('re-calls recomputeTotals when items change', () => {
    makeCartState([], [mockProduct]);
    const { rerender } = renderHook(() => useCartAutoTotals());
    expect(mockRecomputeTotals).toHaveBeenCalledTimes(1);

    makeCartState([{ productId: 'p1', qty: 1 }], [mockProduct]);
    rerender();
    expect(mockRecomputeTotals).toHaveBeenCalledTimes(2);
  });

  it('re-calls recomputeTotals when products change', () => {
    makeCartState([], [mockProduct]);
    const { rerender } = renderHook(() => useCartAutoTotals());
    expect(mockRecomputeTotals).toHaveBeenCalledTimes(1);

    const newProduct = { ...mockProduct, id: 'p2' };
    makeCartState([], [mockProduct, newProduct]);
    rerender();
    expect(mockRecomputeTotals).toHaveBeenCalledTimes(2);
  });
});
