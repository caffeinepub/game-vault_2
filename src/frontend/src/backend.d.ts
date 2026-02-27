import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PromotionRequest {
    id: bigint;
    status: string;
    link: string;
    createdAt: bigint;
    submitterUsername: string;
    description: string;
    imageUrl: string;
    promotionType: string;
}
export interface PaymentSettings {
    bitcoinWallet: string;
    ethereumWallet: string;
    xboxInstructions: string;
    etsyInstructions: string;
    amazonInstructions: string;
    paypalEmail: string;
}
export interface Ad {
    id: bigint;
    title: string;
    linkUrl: string;
    createdAt: bigint;
    description: string;
    isActive: boolean;
    imageUrl: string;
    adType: string;
}
export interface Coupon {
    discountValue: bigint;
    code: string;
    discountType: string;
    usedCount: bigint;
    isActive: boolean;
    maxUses: bigint;
}
export interface Membership {
    paymentMethod: string;
    expiresAt: bigint;
    customerUsername: Username;
    purchasedAt: bigint;
    membershipId: bigint;
    paymentReference: string;
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
export interface Product {
    id: bigint;
    name: string;
    isAvailable: boolean;
    description: string;
    imageUrl: string;
    category: string;
    price: bigint;
}
export interface UserProfile {
    username: string;
    email: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    attachFileToProduct(productId: bigint, fileName: string, fileType: string, fileData: Uint8Array): Promise<bigint>;
    checkActiveMembership(customerUsername: Username): Promise<boolean>;
    createAd(adType: string, title: string, description: string, imageUrl: string, linkUrl: string): Promise<bigint>;
    createCoupon(code: string, discountType: string, discountValue: bigint, maxUses: bigint, isActive: boolean): Promise<void>;
    createPackage(name: string, description: string, price: bigint, features: Array<string>): Promise<bigint>;
    createProduct(name: string, description: string, price: bigint, category: string, imageUrl: string): Promise<bigint>;
    deleteAd(id: bigint): Promise<void>;
    deleteCoupon(code: string): Promise<void>;
    deletePackage(id: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    downloadProductFile(fileId: bigint): Promise<Uint8Array>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomerOrders(customerUsername: Username): Promise<Array<Order>>;
    getMembershipStatus(customerUsername: Username): Promise<Membership | null>;
    getPackage(id: bigint): Promise<Package | null>;
    getPaymentSettings(): Promise<PaymentSettings | null>;
    getProduct(id: bigint): Promise<Product | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listActiveAds(): Promise<Array<Ad>>;
    listActivePackages(): Promise<Array<Package>>;
    listAllAds(): Promise<Array<Ad>>;
    listAllCoupons(): Promise<Array<Coupon>>;
    listAllMemberships(): Promise<Array<Membership>>;
    listAllOrders(): Promise<Array<[Username, Array<Order>]>>;
    listAllPromotionRequests(): Promise<Array<PromotionRequest>>;
    listAvailableProducts(): Promise<Array<Product>>;
    listProductFiles(productId: bigint): Promise<Array<{
        fileName: string;
        fileType: string;
        fileId: bigint;
    }>>;
    listProductFilesAdmin(productId: bigint): Promise<Array<{
        fileName: string;
        fileType: string;
        fileId: bigint;
    }>>;
    placeOrder(customerUsername: Username, itemName: string, price: bigint, paymentMethod: string, paymentReference: string, couponCode: string | null, deliveryEmail: string): Promise<bigint>;
    purchaseMembership(customerUsername: Username, paymentMethod: string, paymentReference: string): Promise<bigint>;
    registerUser(username: string, email: string): Promise<void>;
    removeFileFromProduct(productId: bigint, fileId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePaymentSettings(settings: PaymentSettings): Promise<void>;
    submitPromotionRequest(submitterUsername: string, promotionType: string, link: string, description: string, imageUrl: string): Promise<bigint>;
    updateAd(id: bigint, adType: string, title: string, description: string, imageUrl: string, linkUrl: string, isActive: boolean): Promise<void>;
    updateCoupon(code: string, discountType: string, discountValue: bigint, maxUses: bigint, isActive: boolean): Promise<void>;
    updateOrderStatus(customerUsername: Username, orderId: bigint, status: string): Promise<void>;
    updatePackage(id: bigint, name: string, description: string, price: bigint, features: Array<string>, isActive: boolean): Promise<void>;
    updateProduct(id: bigint, name: string, description: string, price: bigint, category: string, imageUrl: string, isAvailable: boolean): Promise<void>;
    updatePromotionRequestStatus(id: bigint, status: string): Promise<void>;
    validateCoupon(code: string, customerUsername: Username): Promise<{
        soloUse: boolean;
        coupon: Coupon;
    }>;
}
