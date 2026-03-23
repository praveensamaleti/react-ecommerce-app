import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartItemRow } from './CartItemRow';
import type { Product } from '../types/domain';

jest.mock('../hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => require('../utils/money').formatMoney,
}));

const product: Product = {
  id: 'p1',
  name: 'Blue Shirt',
  price: 29.99,
  images: ['https://example.com/shirt.jpg'],
  category: 'Clothing',
  stock: 10,
  rating: 3.5,
  ratingCount: 8,
  description: 'Nice shirt',
  specs: {},
  reviews: [],
};

describe('CartItemRow', () => {
  it('renders product name', () => {
    render(<CartItemRow product={product} qty={2} onQtyChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText('Blue Shirt')).toBeInTheDocument();
  });

  it('renders product price per unit', () => {
    render(<CartItemRow product={product} qty={2} onQtyChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText('$29.99 each')).toBeInTheDocument();
  });

  it('renders the product image', () => {
    render(<CartItemRow product={product} qty={2} onQtyChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByAltText('Blue Shirt')).toBeInTheDocument();
  });

  it('renders correct line total (price x qty)', () => {
    render(<CartItemRow product={product} qty={3} onQtyChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText('$89.97')).toBeInTheDocument();
  });

  it('qty input value matches qty prop', () => {
    render(<CartItemRow product={product} qty={4} onQtyChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByLabelText(`Quantity for ${product.name}`)).toHaveValue(4);
  });

  it('qty input change calls onQtyChange with parsed number', () => {
    const onQtyChange = jest.fn();
    render(<CartItemRow product={product} qty={1} onQtyChange={onQtyChange} onRemove={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(`Quantity for ${product.name}`), { target: { value: '5' } });
    expect(onQtyChange).toHaveBeenCalledWith(5);
  });

  it('remove button click calls onRemove', () => {
    const onRemove = jest.fn();
    render(<CartItemRow product={product} qty={1} onQtyChange={jest.fn()} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: /remove blue shirt from cart/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-label on the container', () => {
    render(<CartItemRow product={product} qty={1} onQtyChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByRole('generic', { name: `Cart item ${product.name}` })).toBeInTheDocument();
  });

  it('shows Out of stock badge when outOfStock=true', () => {
    render(
      <CartItemRow
        product={product}
        qty={1}
        onQtyChange={jest.fn()}
        onRemove={jest.fn()}
        outOfStock={true}
      />
    );
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('does not show Out of stock badge when outOfStock=false', () => {
    render(<CartItemRow product={product} qty={1} onQtyChange={jest.fn()} onRemove={jest.fn()} outOfStock={false} />);
    expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
  });

  it('shows insufficient stock badge when qty exceeds availableStock and not outOfStock', () => {
    render(
      <CartItemRow
        product={product}
        qty={5}
        onQtyChange={jest.fn()}
        onRemove={jest.fn()}
        outOfStock={false}
        insufficientStock={true}
        availableStock={3}
      />
    );
    expect(screen.getByText('Only 3 available')).toBeInTheDocument();
  });

  it('does not show insufficient stock badge when outOfStock=true', () => {
    render(
      <CartItemRow
        product={product}
        qty={5}
        onQtyChange={jest.fn()}
        onRemove={jest.fn()}
        outOfStock={true}
        insufficientStock={true}
        availableStock={0}
      />
    );
    expect(screen.queryByText(/only/i)).not.toBeInTheDocument();
  });

  it('shows no stock badges by default', () => {
    render(<CartItemRow product={product} qty={1} onQtyChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
    expect(screen.queryByText(/only/i)).not.toBeInTheDocument();
  });
});
