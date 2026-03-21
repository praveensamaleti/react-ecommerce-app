import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formats zero', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('formats a typical price', () => {
    expect(formatMoney(129.99)).toBe('$129.99');
  });

  it('formats a thousands value with comma', () => {
    expect(formatMoney(1000)).toBe('$1,000.00');
  });

  it('formats a negative value', () => {
    expect(formatMoney(-5)).toBe('-$5.00');
  });

  it('formats a very large number', () => {
    expect(formatMoney(1000000)).toBe('$1,000,000.00');
  });

  it('rounds fractional cents', () => {
    expect(formatMoney(9.999)).toBe('$10.00');
  });
});

describe('formatMoney — currency conversion', () => {
  it('converts to EUR', () => {
    expect(formatMoney(100, 'EUR')).toBe('€92.00');
  });

  it('converts to JPY (no decimal places)', () => {
    expect(formatMoney(1, 'JPY')).toBe('¥149');
  });

  it('converts to INR', () => {
    expect(formatMoney(10, 'INR')).toBe('₹835.00');
  });
});
