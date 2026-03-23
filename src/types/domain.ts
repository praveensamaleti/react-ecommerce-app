export type Category = string;

export const FALLBACK_CATEGORIES: string[] = ["Electronics", "Clothing", "Home", "Books", "Sports"];

export type Review = {
  id: string;
  userName: string;
  rating: number; // 1..5
  title: string;
  body: string;
  createdAt: string; // ISO
};

export type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: Category;
  stock: number;
  rating: number; // 0..5 (avg)
  ratingCount: number;
  description: string;
  specs: Record<string, string>;
  reviews: Review[];
  featured?: boolean;
};

export type CartItem = {
  productId: string;
  qty: number;
};

export type UserRole = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  token: string;
  user: User;
};

export type Address = {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type Payment = {
  cardName: string;
  cardNumber: string;
  exp: string;
  cvc: string;
};

export type OrderStatus = "pending" | "shipped";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  userId: string;
  createdAt: string; // ISO
  status: OrderStatus;
  items: OrderItem[];
  shipping: Address;
  billing: Address;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

