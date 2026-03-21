import { useCurrencyStore } from './currencyStore';

beforeEach(() => {
  useCurrencyStore.setState({ currency: 'USD' });
});

describe('currencyStore', () => {
  it('initial state is USD', () => {
    expect(useCurrencyStore.getState().currency).toBe('USD');
  });

  it('setCurrency("EUR") sets EUR', () => {
    useCurrencyStore.getState().setCurrency('EUR');
    expect(useCurrencyStore.getState().currency).toBe('EUR');
  });

  it('setCurrency("INR") sets INR', () => {
    useCurrencyStore.getState().setCurrency('INR');
    expect(useCurrencyStore.getState().currency).toBe('INR');
  });
});
