import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import type { Product } from '../types/domain';

jest.mock('../hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => require('../utils/money').formatMoney,
}));

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Test Widget',
  price: 49.99,
  images: ['https://example.com/img.jpg'],
  category: 'Electronics',
  stock: 5,
  rating: 4.2,
  ratingCount: 17,
  description: 'A great product',
  specs: {},
  reviews: [],
  variants: [],
  ...overrides,
});

const makeVariant = (id: string, price: number, attrs: Record<string, string> = {}) => ({
  id,
  sku: `SKU-${id}`,
  stock: 5,
  price,
  attributes: attrs,
  label: Object.values(attrs).join(' / '),
});

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('ProductCard', () => {
  it('renders product name', () => {
    wrap(<ProductCard product={makeProduct()} onAddToCart={jest.fn()} />);
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    wrap(<ProductCard product={makeProduct()} onAddToCart={jest.fn()} />);
    expect(screen.getByText('$49.99')).toBeInTheDocument();
  });

  it('renders product image', () => {
    wrap(<ProductCard product={makeProduct()} onAddToCart={jest.fn()} />);
    expect(screen.getByAltText('Test Widget')).toBeInTheDocument();
  });

  it('renders RatingStars with correct rating', () => {
    wrap(<ProductCard product={makeProduct()} onAddToCart={jest.fn()} />);
    expect(screen.getByRole('img', { name: /4.2/i })).toBeInTheDocument();
  });

  it('"Add to cart" button calls onAddToCart with product id', () => {
    const onAddToCart = jest.fn();
    wrap(<ProductCard product={makeProduct()} onAddToCart={onAddToCart} />);
    fireEvent.click(screen.getByRole('button', { name: /add test widget to cart/i }));
    expect(onAddToCart).toHaveBeenCalledWith('p1');
  });

  it('"Add to cart" button is disabled when stock <= 0', () => {
    wrap(<ProductCard product={makeProduct({ stock: 0 })} onAddToCart={jest.fn()} />);
    expect(screen.getByRole('button', { name: /add test widget to cart/i })).toBeDisabled();
  });

  it('shows "Out of stock" badge when stock <= 0', () => {
    wrap(<ProductCard product={makeProduct({ stock: 0 })} onAddToCart={jest.fn()} />);
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('does not show "Out of stock" badge when stock > 0', () => {
    wrap(<ProductCard product={makeProduct({ stock: 5 })} onAddToCart={jest.fn()} />);
    expect(screen.queryByText('Out of stock')).toBeNull();
  });

  it('renders Quick view button when onQuickView provided', () => {
    const onQuickView = jest.fn();
    wrap(<ProductCard product={makeProduct()} onAddToCart={jest.fn()} onQuickView={onQuickView} />);
    expect(screen.getByRole('button', { name: /quick view test widget/i })).toBeInTheDocument();
  });

  it('calls onQuickView with product when Quick view clicked', () => {
    const onQuickView = jest.fn();
    const product = makeProduct();
    wrap(<ProductCard product={product} onAddToCart={jest.fn()} onQuickView={onQuickView} />);
    fireEvent.click(screen.getByRole('button', { name: /quick view test widget/i }));
    expect(onQuickView).toHaveBeenCalledWith(product);
  });

  it('does not render Quick view button when onQuickView absent', () => {
    wrap(<ProductCard product={makeProduct()} onAddToCart={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /quick view/i })).toBeNull();
  });

  it('shows qty counter when cartQty > 0', () => {
    wrap(<ProductCard product={makeProduct()} onAddToCart={jest.fn()} cartQty={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decrease quantity/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /increase quantity/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add test widget to cart/i })).toBeNull();
  });

  it('+ button calls onQtyChange with qty+1', () => {
    const onQtyChange = jest.fn();
    wrap(<ProductCard product={makeProduct()} onAddToCart={jest.fn()} cartQty={2} onQtyChange={onQtyChange} />);
    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }));
    expect(onQtyChange).toHaveBeenCalledWith('p1', 3);
  });

  it('- button calls onQtyChange with qty-1 when qty > 1', () => {
    const onQtyChange = jest.fn();
    wrap(<ProductCard product={makeProduct()} onAddToCart={jest.fn()} cartQty={3} onQtyChange={onQtyChange} />);
    fireEvent.click(screen.getByRole('button', { name: /decrease quantity/i }));
    expect(onQtyChange).toHaveBeenCalledWith('p1', 2);
  });

  it('- button calls onRemoveFromCart when qty === 1', () => {
    const onRemoveFromCart = jest.fn();
    wrap(<ProductCard product={makeProduct()} onAddToCart={jest.fn()} cartQty={1} onRemoveFromCart={onRemoveFromCart} />);
    fireEvent.click(screen.getByRole('button', { name: /decrease quantity/i }));
    expect(onRemoveFromCart).toHaveBeenCalledWith('p1');
  });

  describe('variant product', () => {
    it('shows "From $X" price prefix using the lowest variant price', () => {
      const product = makeProduct({
        variants: [makeVariant('v1', 39.99), makeVariant('v2', 59.99)],
      });
      wrap(<ProductCard product={product} onAddToCart={jest.fn()} />);
      expect(screen.getByText(/from/i)).toBeInTheDocument();
      expect(screen.getByText(/\$39\.99/)).toBeInTheDocument();
    });

    it('shows "X options" badge', () => {
      const product = makeProduct({
        variants: [makeVariant('v1', 29.99), makeVariant('v2', 39.99)],
      });
      wrap(<ProductCard product={product} onAddToCart={jest.fn()} />);
      expect(screen.getByText('2 options')).toBeInTheDocument();
    });

    it('shows "Select options" link instead of Add to Cart button', () => {
      const product = makeProduct({
        variants: [makeVariant('v1', 29.99)],
      });
      wrap(<ProductCard product={product} onAddToCart={jest.fn()} />);
      expect(screen.getByRole('link', { name: /select options for test widget/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add test widget to cart/i })).toBeNull();
    });

    it('shows colour swatches when variants have color attribute', () => {
      const product = makeProduct({
        variants: [
          makeVariant('v1', 29.99, { color: 'Red' }),
          makeVariant('v2', 39.99, { color: 'Blue' }),
        ],
      });
      wrap(<ProductCard product={product} onAddToCart={jest.fn()} />);
      expect(screen.getByLabelText('Available colours')).toBeInTheDocument();
      expect(screen.getByLabelText('Red')).toBeInTheDocument();
      expect(screen.getByLabelText('Blue')).toBeInTheDocument();
    });

    it('does not show colour swatches when variants have no color attribute', () => {
      const product = makeProduct({
        variants: [makeVariant('v1', 29.99, { size: 'M' })],
      });
      wrap(<ProductCard product={product} onAddToCart={jest.fn()} />);
      expect(screen.queryByLabelText('Available colours')).toBeNull();
    });

    it('uses product price when variant has no price override', () => {
      const noOverrideVariant = { id: 'v1', stock: 5, attributes: {}, variants: [] as any };
      const product = makeProduct({ price: 99.99, variants: [noOverrideVariant] });
      wrap(<ProductCard product={product} onAddToCart={jest.fn()} />);
      expect(screen.getByText(/\$99\.99/)).toBeInTheDocument();
    });
  });
});
