import { useAppSelector } from "../store/hooks";
import { formatMoney } from "../utils/money";

export function useCurrencyFormatter(): (value: number) => string {
  const currency = useAppSelector((s) => s.currency.currency);
  return (value: number) => formatMoney(value, currency);
}
