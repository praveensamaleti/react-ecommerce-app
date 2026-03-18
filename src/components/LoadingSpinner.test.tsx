import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders spinner with default aria-label="Loading"', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with custom label text and uses it as aria-label', () => {
    render(<LoadingSpinner label="Fetching data" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Fetching data');
    expect(screen.getByText('Fetching data')).toBeInTheDocument();
  });

  it('does not render label text when label prop absent', () => {
    const { container } = render(<LoadingSpinner />);
    // Only the spinner itself, no extra text node
    expect(container.querySelector('span.ms-3')).toBeNull();
  });
});
