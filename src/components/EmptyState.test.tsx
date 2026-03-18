import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders optional description', () => {
    render(<EmptyState title="T" description="Some description" />);
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('does not render description when absent', () => {
    render(<EmptyState title="T" />);
    expect(screen.queryByText('Some description')).toBeNull();
  });

  it('renders action button when actionLabel and onAction provided', () => {
    const onAction = jest.fn();
    render(<EmptyState title="T" actionLabel="Do it" onAction={onAction} />);
    expect(screen.getByRole('button', { name: 'Do it' })).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const onAction = jest.fn();
    render(<EmptyState title="T" actionLabel="Do it" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Do it' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render button when actionLabel absent', () => {
    render(<EmptyState title="T" onAction={jest.fn()} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has role="status" and aria-live="polite"', () => {
    render(<EmptyState title="T" />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });
});
