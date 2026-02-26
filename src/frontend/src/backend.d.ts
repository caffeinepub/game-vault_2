import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PaymentSettings {
    bitcoinWallet: string;
    ethereumWallet: string;
    xboxInstructions: string;
    etsyInstructions: string;
    amazonInstructions: string;
    paypalEmail: string;
}
export interface Coupon {
    discountValue: bigint;
    code: string;
    discountType: string;
    usedCount: bigint;
    isActive: boolean;
    maxUses: bigint;
}
export type Username = string;
export interface Package {
    id: bigint;
    features: Array<string>;
    name: string;
    description: string;
    isActive: boolean;
    price: bigint;
}
export interface Order {
    status: string;
    couponCode?: string;
    paymentMethod: string;
    deliveryEmail: string;
    customerUsername: Username;
    orderId: bigint;
    timestamp: bigint;
    itemName: string;
    paymentReference: string;
    price: bigint;
}
export interface UserProfile {
    username: string;
    email: string;
}
export interface Product {
    id: bigint;
    name: string;
    isAvailable: boolean;
    description: string;
    imageUrl: string;
    category: string;
    price: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCoupon(code: string, discountType: string, discountValue: bigint, maxUses: bigint, isActive: boolean): Promise<void>;
    createPackage(name: string, description: string, price: bigint, features: Array<string>): Promise<bigint>;
    createProduct(name: string, description: string, price: bigint, category: string, imageUrl: string): Promise<bigint>;
    deleteCoupon(code: string): Promise<void>;
    deletePackage(id: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomerOrders(customerUsername: Username): Promise<Array<Order>>;
    getPackage(id: bigint): Promise<Package | null>;
    getPaymentSettings(): Promise<PaymentSettings | null>;
    getProduct(id: bigint): Promise<Product | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listActivePackages(): Promise<Array<Package>>;
    listAllCoupons(): Promise<Array<Coupon>>;
    listAllOrders(): Promise<Array<[Username, Array<Order>]>>;
    listAvailableProducts(): Promise<Array<Product>>;
    placeOrder(customerUsername: Username, itemName: string, price: bigint, paymentMethod: string, paymentReference: string, couponCode: string | null, deliveryEmail: string): Promise<bigint>;
    registerUser(username: string, email: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePaymentSettings(settings: PaymentSettings): Promise<void>;
    updateCoupon(code: string, discountType: string, discountValue: bigint, maxUses: bigint, isActive: boolean): Promise<void>;
    updateOrderStatus(customerUsername: Username, orderId: bigint, status: string): Promise<void>;
    updatePackage(id: bigint, name: string, description: string, price: bigint, features: Array<string>, isActive: boolean): Promise<void>;
    updateProduct(id: bigint, name: string, description: string, price: bigint, category: string, imageUrl: string, isAvailable: boolean): Promise<void>;
    validateCoupon(code: string, customerUsername: Username): Promise<{
        soloUse: boolean;
        coupon: Coupon;
    }>;
}
