export type Page =
  | "store"
  | "product-detail"
  | "checkout"
  | "auth"
  | "dashboard"
  | "admin";

export interface CheckoutItem {
  id: bigint;
  name: string;
  price: bigint;
  isPackage?: boolean;
}
