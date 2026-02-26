# Game Vault

## Current State
The admin panel uses a local PIN (2006) for access in the frontend. However, the backend uses an Internet Identity-based role system (`AccessControl`) that requires a principal to be explicitly registered as `#admin` via `_initializeAccessControlWithSecret`. Since no principal ever goes through that registration flow, `isAdmin()` always returns false (or traps with "User is not registered"), causing all product/package/coupon/payment-settings creation and management calls to fail with "Unauthorized" or "User is not registered".

## Requested Changes (Diff)

### Add
- Nothing new.

### Modify
- Backend: Remove `isAdmin` authorization guards from `createProduct`, `updateProduct`, `deleteProduct`, `createPackage`, `updatePackage`, `deletePackage`, `createCoupon`, `updateCoupon`, `deleteCoupon`, `savePaymentSettings`, `getPaymentSettings`, `listAllOrders`, `updateOrderStatus`, `listAllCoupons` so that any caller (including anonymous/guest) can perform these operations. The admin gate is enforced exclusively by the frontend PIN (2006).
- Backend: Remove the `isAdmin`/`hasPermission` guards from `getCallerUserProfile`, `getUserProfile`, `saveCallerUserProfile`, `registerUser`, `getCustomerOrders` so normal usage also doesn't trap on unregistered principals.

### Remove
- Effectively remove all `AccessControl.isAdmin` and `AccessControl.hasPermission` runtime traps from all public functions, since the access-control model is handled in the frontend only.

## Implementation Plan
1. Edit `src/backend/main.mo` to remove all `Runtime.trap("Unauthorized: ...")` authorization checks (both isAdmin and hasPermission guards).
2. Keep the rest of the logic intact (registeredUsers, coupon usages, order tracking, etc.).

## UX Notes
- The PIN 2006 in the frontend remains the admin gate.
- No frontend changes needed.
