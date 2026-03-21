import { renderHook } from '@testing-library/react';
import { useCartAutoTotals } from './useCartAutoTotals';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { recomputeTotals } from '../store/slices/cartSlice';

jest.mock('../store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

const mockDispatch = jest.fn();

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

const makeState = (items: any[], products: any[]) => {
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      cart: { items },
      products: { products },
    })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useCartAutoTotals', () => {
  it('does NOT call recomputeTotals when products is empty', () => {
    makeState([], []);
    renderHook(() => useCartAutoTotals());
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('dispatches recomputeTotals with products when products is non-empty', () => {
    makeState([], [mockProduct]);
    renderHook(() => useCartAutoTotals());
    expect(mockDispatch).toHaveBeenCalledWith(recomputeTotals([mockProduct]));
  });

  it('re-dispatches recomputeTotals when items change', () => {
    makeState([], [mockProduct]);
    const { rerender } = renderHook(() => useCartAutoTotals());
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    makeState([{ productId: 'p1', qty: 1 }], [mockProduct]);
    rerender();
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('re-dispatches recomputeTotals when products change', () => {
    makeState([], [mockProduct]);
    const { rerender } = renderHook(() => useCartAutoTotals());
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    const newProduct = { ...mockProduct, id: 'p2' };
    makeState([], [mockProduct, newProduct]);
    rerender();
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });
});
