import * as React from "react";
import { useCartStore } from "../stores/cartStore";
import { useProductsStore } from "../stores/productsStore";

export function useCartAutoTotals() {
  const items = useCartStore((s) => s.items);
  const recomputeTotals = useCartStore((s) => s.recomputeTotals);
  const products = useProductsStore((s) => s.products);

  React.useEffect(() => {
    if (products.length === 0) return;
    recomputeTotals(products);
  }, [items, products, recomputeTotals]);
}

