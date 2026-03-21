import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencySelector } from './CurrencySelector';
import { useCurrencyStore } from '../stores/currencyStore';

jest.mock('../stores/currencyStore');

const mockSetCurrency = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useCurrencyStore as jest.Mock).mockReturnValue({ currency: 'USD', setCurrency: mockSetCurrency });
});

describe('CurrencySelector', () => {
  it('renders all 5 currency options', () => {
    render(<CurrencySelector />);
    const select = screen.getByRole('combobox', { name: /select currency/i });
    expect(select.querySelectorAll('option')).toHaveLength(5);
    expect(screen.getByText('$ USD')).toBeInTheDocument();
    expect(screen.getByText('€ EUR')).toBeInTheDocument();
    expect(screen.getByText('£ GBP')).toBeInTheDocument();
    expect(screen.getByText('₹ INR')).toBeInTheDocument();
    expect(screen.getByText('¥ JPY')).toBeInTheDocument();
  });

  it('selected value matches store currency (USD by default)', () => {
    render(<CurrencySelector />);
    const select = screen.getByRole('combobox', { name: /select currency/i }) as HTMLSelectElement;
    expect(select.value).toBe('USD');
  });

  it('changing the select calls setCurrency with the new code', () => {
    render(<CurrencySelector />);
    const select = screen.getByRole('combobox', { name: /select currency/i });
    fireEvent.change(select, { target: { value: 'EUR' } });
    expect(mockSetCurrency).toHaveBeenCalledWith('EUR');
  });
});
