export type Page =
  | "store"
  | "product-detail"
  | "checkout"
  | "basket"
  | "auth"
  | "dashboard"
  | "admin";

export interface CheckoutItem {
  id: bigint;
  name: string;
  price: bigint;
  isPackage?: boolean;
}

export interface BasketItem {
  id: bigint;
  name: string;
  price: bigint;
  quantity: number;
  isPackage?: boolean;
}
