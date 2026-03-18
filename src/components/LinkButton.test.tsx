import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LinkButton } from './LinkButton';

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('LinkButton', () => {
  it('renders an anchor with correct href', () => {
    wrap(<LinkButton to="/products">Go</LinkButton>);
    expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('href', '/products');
  });

  it('applies default variant class btn-primary', () => {
    wrap(<LinkButton to="/">Click</LinkButton>);
    expect(screen.getByRole('link')).toHaveClass('btn-primary');
  });

  it('applies outline-danger variant', () => {
    wrap(<LinkButton to="/" variant="outline-danger">Click</LinkButton>);
    expect(screen.getByRole('link')).toHaveClass('btn-outline-danger');
  });

  it('applies size sm', () => {
    wrap(<LinkButton to="/" size="sm">Click</LinkButton>);
    expect(screen.getByRole('link')).toHaveClass('btn-sm');
  });

  it('disabled=true adds disabled class and aria-disabled', () => {
    wrap(<LinkButton to="/" disabled>Click</LinkButton>);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('disabled');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabIndex', '-1');
  });

  it('click on disabled calls preventDefault and NOT the onClick handler', () => {
    const onClick = jest.fn();
    wrap(<LinkButton to="/" disabled onClick={onClick}>Click</LinkButton>);
    fireEvent.click(screen.getByRole('link'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('click on enabled calls the onClick handler', () => {
    const onClick = jest.fn();
    wrap(<LinkButton to="/" onClick={onClick}>Click</LinkButton>);
    fireEvent.click(screen.getByRole('link'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders children', () => {
    wrap(<LinkButton to="/">My Label</LinkButton>);
    expect(screen.getByText('My Label')).toBeInTheDocument();
  });
});
