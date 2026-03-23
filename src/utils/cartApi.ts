import api from './api';
import type { CartItem } from '../types/domain';

export const fetchServerCart = () =>
  api.get<{ items: CartItem[]; hasOutOfStockItems: boolean }>('/api/cart');

export const syncServerCart = (items: CartItem[]) =>
  api.post<{ items: CartItem[]; hasOutOfStockItems: boolean }>('/api/cart/sync', { items });

export const addServerCartItem = (productId: string, qty: number) =>
  api.post('/api/cart/items', { productId, qty });

export const updateServerCartItem = (productId: string, qty: number) =>
  api.put(`/api/cart/items/${productId}`, { qty });

export const removeServerCartItem = (productId: string) =>
  api.delete(`/api/cart/items/${productId}`);
