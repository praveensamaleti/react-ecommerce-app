import * as React from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { recomputeTotals } from "../store/slices/cartSlice";

export function useCartAutoTotals() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const products = useAppSelector((s) => s.products.products);

  React.useEffect(() => {
    if (products.length === 0) return;
    dispatch(recomputeTotals(products));
  }, [items, products, dispatch]);
}
