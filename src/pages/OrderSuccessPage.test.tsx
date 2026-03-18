import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OrderSuccessPage } from './OrderSuccessPage';

const wrap = (state?: any) =>
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/order-success', state }]}
    >
      <Routes>
        <Route path="/order-success" element={<OrderSuccessPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('OrderSuccessPage', () => {
  it('renders "Success!" text', () => {
    wrap();
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('shows order id when provided in location state', () => {
    wrap({ orderId: 'o99' });
    expect(screen.getByText(/Order #o99/)).toBeInTheDocument();
  });

  it('does not show orderId text when location state is absent', () => {
    wrap();
    expect(screen.queryByText(/Order #/)).toBeNull();
  });

  it('"Continue shopping" link goes to /products', () => {
    wrap();
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/products');
  });

  it('"View profile" link goes to /profile', () => {
    wrap();
    expect(screen.getByRole('link', { name: 'View profile' })).toHaveAttribute('href', '/profile');
  });
});
