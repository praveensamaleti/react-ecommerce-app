import { useCartStore } from './cartStore';
import type { Product } from '../types/domain';

const makeProduct = (id: string, price: number, stock = 10): Product => ({
  id,
  name: `Product ${id}`,
  price,
  images: ['img.jpg'],
  category: 'Electronics',
  stock,
  rating: 4,
  ratingCount: 5,
  description: 'desc',
  specs: {},
  reviews: [],
});

const initialItems = [] as const;
const initialTotals = { subtotal: 0, discount: 0, tax: 0, total: 0, itemCount: 0 };

beforeEach(() => {
  useCartStore.setState({ items: [], totals: { ...initialTotals } });
  localStorage.clear();
});

describe('initial state', () => {
  it('has empty items', () => {
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('has all-zero totals', () => {
    expect(useCartStore.getState().totals).toEqual(initialTotals);
  });
});

describe('addToCart', () => {
  it('adds a new item with qty=1', () => {
    useCartStore.getState().addToCart('p1');
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ productId: 'p1', qty: 1 });
  });

  it('increments qty when same product added again', () => {
    useCartStore.getState().addToCart('p1');
    useCartStore.getState().addToCart('p1');
    expect(useCartStore.getState().items[0].qty).toBe(2);
  });

  it('clamps accumulated qty to 99', () => {
    useCartStore.getState().addToCart('p1', 50);
    useCartStore.getState().addToCart('p1', 60);
    expect(useCartStore.getState().items[0].qty).toBe(99);
  });

  it('clamps initial qty 0 to 1', () => {
    useCartStore.getState().addToCart('p1', 0);
    expect(useCartStore.getState().items[0].qty).toBe(1);
  });

  it('adds multiple distinct products', () => {
    useCartStore.getState().addToCart('p1');
    useCartStore.getState().addToCart('p2');
    expect(useCartStore.getState().items).toHaveLength(2);
  });
});

describe('removeFromCart', () => {
  it('removes an existing item', () => {
    useCartStore.getState().addToCart('p1');
    useCartStore.getState().removeFromCart('p1');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('does not throw for a missing id', () => {
    expect(() => useCartStore.getState().removeFromCart('missing')).not.toThrow();
  });
});

describe('setQty', () => {
  it('sets quantity for existing item', () => {
    useCartStore.getState().addToCart('p1');
    useCartStore.getState().setQty('p1', 5);
    expect(useCartStore.getState().items[0].qty).toBe(5);
  });

  it('clamps qty to minimum 1', () => {
    useCartStore.getState().addToCart('p1');
    useCartStore.getState().setQty('p1', 0);
    expect(useCartStore.getState().items[0].qty).toBe(1);
  });

  it('clamps qty to maximum 99', () => {
    useCartStore.getState().addToCart('p1');
    useCartStore.getState().setQty('p1', 150);
    expect(useCartStore.getState().items[0].qty).toBe(99);
  });
});

describe('clearCart', () => {
  it('empties items and resets totals', () => {
    useCartStore.getState().addToCart('p1');
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().totals).toEqual(initialTotals);
  });
});

describe('recomputeTotals', () => {
  const p1 = makeProduct('p1', 100);
  const p2 = makeProduct('p2', 50);

  it('computes correct totals for one item', () => {
    useCartStore.setState({ items: [{ productId: 'p1', qty: 2 }] });
    useCartStore.getState().recomputeTotals([p1]);

    const { totals } = useCartStore.getState();
    const subtotal = 200;
    const discount = 20;
    const taxable = 180;
    const tax = taxable * 0.08;
    const total = taxable + tax;

    expect(totals.subtotal).toBeCloseTo(subtotal);
    expect(totals.discount).toBeCloseTo(discount);
    expect(totals.tax).toBeCloseTo(tax);
    expect(totals.total).toBeCloseTo(total);
    expect(totals.itemCount).toBe(2);
  });

  it('computes correct totals for multiple items', () => {
    useCartStore.setState({ items: [{ productId: 'p1', qty: 1 }, { productId: 'p2', qty: 3 }] });
    useCartStore.getState().recomputeTotals([p1, p2]);

    const { totals } = useCartStore.getState();
    const subtotal = 100 + 150; // 250
    expect(totals.subtotal).toBeCloseTo(250);
    expect(totals.itemCount).toBe(4);
  });

  it('skips products not in the map (price treated as 0)', () => {
    useCartStore.setState({ items: [{ productId: 'unknown', qty: 2 }] });
    useCartStore.getState().recomputeTotals([p1]);
    expect(useCartStore.getState().totals.subtotal).toBe(0);
  });

  it('does not re-set when values unchanged (hasChanged guard)', () => {
    useCartStore.setState({ items: [{ productId: 'p1', qty: 1 }] });
    useCartStore.getState().recomputeTotals([p1]);
    const totals1 = useCartStore.getState().totals;

    // Call again — same products/items
    useCartStore.getState().recomputeTotals([p1]);
    const totals2 = useCartStore.getState().totals;

    // Same reference means setState was NOT called again
    expect(totals1).toBe(totals2);
  });
});
