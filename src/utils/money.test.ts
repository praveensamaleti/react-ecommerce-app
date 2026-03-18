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
