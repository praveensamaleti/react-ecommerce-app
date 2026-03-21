import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuickViewModal } from './QuickViewModal';
import type { Product } from '../types/domain';

jest.mock('../hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => require('../utils/money').formatMoney,
}));

const product: Product = {
  id: 'p1',
  name: 'Cool Gadget',
  price: 199.99,
  images: ['https://example.com/gadget.jpg'],
  category: 'Electronics',
  stock: 8,
  rating: 4.0,
  ratingCount: 12,
  description: 'Very cool gadget',
  specs: {},
  reviews: [],
};

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('QuickViewModal', () => {
  it('returns null when product=null', () => {
    const { container } = wrap(
      <QuickViewModal product={null} show={true} onHide={jest.fn()} onAddToCart={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with product name when show=true', () => {
    wrap(<QuickViewModal product={product} show={true} onHide={jest.fn()} onAddToCart={jest.fn()} />);
    expect(screen.getByText('Cool Gadget')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    wrap(<QuickViewModal product={product} show={true} onHide={jest.fn()} onAddToCart={jest.fn()} />);
    expect(screen.getByText('$199.99')).toBeInTheDocument();
  });

  it('renders product description', () => {
    wrap(<QuickViewModal product={product} show={true} onHide={jest.fn()} onAddToCart={jest.fn()} />);
    expect(screen.getByText('Very cool gadget')).toBeInTheDocument();
  });

  it('renders stock count', () => {
    wrap(<QuickViewModal product={product} show={true} onHide={jest.fn()} onAddToCart={jest.fn()} />);
    expect(screen.getByText('8 in stock')).toBeInTheDocument();
  });

  it('calls onHide when close button clicked', () => {
    const onHide = jest.fn();
    wrap(<QuickViewModal product={product} show={true} onHide={onHide} onAddToCart={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('qty input defaults to 1', () => {
    wrap(<QuickViewModal product={product} show={true} onHide={jest.fn()} onAddToCart={jest.fn()} />);
    expect(screen.getByLabelText('Quantity')).toHaveValue(1);
  });

  it('qty input updates on change', () => {
    wrap(<QuickViewModal product={product} show={true} onHide={jest.fn()} onAddToCart={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '3' } });
    expect(screen.getByLabelText('Quantity')).toHaveValue(3);
  });

  it('"Add to cart" calls onAddToCart with product id and qty', () => {
    const onAddToCart = jest.fn();
    wrap(<QuickViewModal product={product} show={true} onHide={jest.fn()} onAddToCart={onAddToCart} />);
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(onAddToCart).toHaveBeenCalledWith('p1', 2);
  });

  it('"Add to cart" is disabled when stock <= 0', () => {
    const noStock = { ...product, stock: 0 };
    wrap(<QuickViewModal product={noStock} show={true} onHide={jest.fn()} onAddToCart={jest.fn()} />);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });
});
