import { useCurrencyStore } from "../stores/currencyStore";
import { formatMoney } from "../utils/money";

export function useCurrencyFormatter(): (value: number) => string {
  const currency = useCurrencyStore((s) => s.currency);
  return (value: number) => formatMoney(value, currency);
}
