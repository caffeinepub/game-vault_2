# Game Vault

## Current State
A digital gaming store with products (game accounts + downloadable files), subscriptions, orders, coupons, payment settings, and file attachments. The backend uses an authorization module that requires callers to be registered as `#admin` via an identity-based access control system. However, the admin panel uses frontend-only PIN authentication (PIN: 2006), meaning admin backend calls are made by an anonymous or unregistered caller -- causing all admin functions to trap with "User is not registered".

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Remove `#admin` permission checks from all admin-facing backend functions: `createProduct`, `updateProduct`, `deleteProduct`, `createPackage`, `updatePackage`, `deletePackage`, `createCoupon`, `updateCoupon`, `deleteCoupon`, `savePaymentSettings`, `getPaymentSettings`, `attachFileToProduct`, `removeFileFromProduct`, `listProductFilesAdmin`, `listAllOrders`, `updateOrderStatus`, `listAllCoupons`
- Keep `#user` permission checks on user-facing functions: `placeOrder`, `getCustomerOrders`, `validateCoupon`, `downloadProductFile`, `getCallerUserProfile`, `saveCallerUserProfile`
- Keep `registerUser` as-is (no permission check needed)
- Keep public read-only queries as-is: `listAvailableProducts`, `getProduct`, `listActivePackages`, `getPackage`, `listProductFiles`, `getUserProfile`

### Remove
- Nothing

## Implementation Plan
1. Regenerate backend Motoko removing admin permission guards from admin functions while keeping user guards on user functions
2. All data structures and logic remain identical

## UX Notes
- Admin authentication is handled entirely in the frontend via PIN 2006
- No visible change to the user -- products, subscriptions, coupons will now successfully create/update/delete
