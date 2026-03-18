import React from 'react';
import { render, screen } from '@testing-library/react';
import { RatingStars } from './RatingStars';

describe('RatingStars', () => {
  it('renders 5 full stars for rating=5', () => {
    render(<RatingStars rating={5} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rated 5.0 out of 5');
  });

  it('renders 5 empty stars for rating=0', () => {
    render(<RatingStars rating={0} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rated 0.0 out of 5');
  });

  it('renders 3 full + 1 half + 1 empty for rating=3.5', () => {
    const { container } = render(<RatingStars rating={3.5} />);
    // 3 full (gold fill), 1 half (#fde68a fill), 1 empty (transparent fill)
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);
  });

  it('renders 2 full + 3 empty for rating=2.4 (no half at < 0.5)', () => {
    render(<RatingStars rating={2.4} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rated 2.4 out of 5');
  });

  it('clamps rating=7 to 5 full stars', () => {
    render(<RatingStars rating={7} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rated 5.0 out of 5');
  });

  it('clamps rating=-1 to 0 (5 empty stars)', () => {
    render(<RatingStars rating={-1} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rated 0.0 out of 5');
  });

  it('renders count text when count prop provided', () => {
    render(<RatingStars rating={4} count={42} />);
    expect(screen.getByText('(42)')).toBeInTheDocument();
  });

  it('does not render count text when count prop absent', () => {
    render(<RatingStars rating={4} />);
    expect(screen.queryByText(/\(/)).toBeNull();
  });

  it('uses custom ariaLabel when provided', () => {
    render(<RatingStars rating={3} ariaLabel="Custom label" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Custom label');
  });

  it('default aria-label includes rating value', () => {
    render(<RatingStars rating={4.5} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rated 4.5 out of 5');
  });
});
