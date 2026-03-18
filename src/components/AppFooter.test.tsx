import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppFooter } from './AppFooter';

describe('AppFooter', () => {
  it('renders "React Store" text', () => {
    render(<AppFooter />);
    // There may be multiple, find the brand name
    const elements = screen.getAllByText('React Store');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders the current year', () => {
    render(<AppFooter />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
