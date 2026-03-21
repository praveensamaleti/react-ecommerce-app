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
  ...overrides,
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
});
