import React from "react";
import { Form } from "react-bootstrap";
import { useCurrencyStore } from "../stores/currencyStore";
import type { CurrencyCode } from "../utils/money";

const CURRENCIES = [
  { code: "USD", label: "$ USD" },
  { code: "EUR", label: "€ EUR" },
  { code: "GBP", label: "£ GBP" },
  { code: "INR", label: "₹ INR" },
  { code: "JPY", label: "¥ JPY" },
];

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrencyStore();
  return (
    <Form.Select
      size="sm"
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      aria-label="Select currency"
      style={{ width: "auto" }}
    >
      {CURRENCIES.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </Form.Select>
  );
};
