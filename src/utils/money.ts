export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "JPY";

export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  JPY: 149.0,
};

export function formatMoney(value: number, currency: CurrencyCode = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value * EXCHANGE_RATES[currency]);
}
