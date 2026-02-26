# Game Vault

## Current State
A Shopify-style digital gaming store built on ICP/Motoko with a React frontend. The store has:
- A storefront with products, CPM services, Lua scripts, and subscription packages
- Customer auth via Internet Identity with username/email registration
- An admin panel (PIN: 2006) for managing products, orders, subscriptions, payments, and coupons
- Coupon system with percentage and fixed discounts
- Checkout with PayPal, Bitcoin, Ethereum, and gift card payment options
- Order management where admin accepts/declines and customers download files

## Requested Changes (Diff)

### Add
- Nothing new to add

### Modify
- **Backend**: Remove `AccessControl.hasPermission(... #user)` guards from `getCallerUserProfile`, `saveCallerUserProfile`, `placeOrder`, `getCustomerOrders`, and `validateCoupon`. These functions fail for Internet Identity users who haven't been assigned a role via `_initializeAccessControlWithSecret`. The admin-only pattern of this app means role-based guards on user functions break everything.
- **Backend**: Fix `listAvailableProducts` -- the `.sort()` call on a Motoko array needs a comparator function or should use `.vals()` directly.
- **Frontend AuthPage**: When login fails with "Unauthorized" or permission error, show a more specific error message. When registering, if `registerUser` throws "Username already exists", show a friendly message instead of generic "failed".
- **Frontend AuthPage**: After successful Internet Identity login, attempt to auto-login (look up profile) before showing the register tab, so returning users who are already authenticated don't see "Login failed".

### Remove
- Nothing to remove

## Implementation Plan
1. Rewrite Motoko backend removing permission guards from user-facing functions (`getCallerUserProfile`, `saveCallerUserProfile`, `placeOrder`, `getCustomerOrders`, `validateCoupon`). Keep admin-only functions without guards (they already had none). Fix `listAvailableProducts` sort.
2. Update frontend AuthPage to handle "Username already exists" error with a friendly message and auto-attempt login lookup when identity is already connected on page load.

## UX Notes
- The core issue is that Internet Identity users get an anonymous actor until `_initializeAccessControlWithSecret` runs. Since that's async, user-facing calls that need `#user` role fail. Removing those guards is the correct fix -- the functions are scoped to the caller's own data anyway.
- Register error when username is taken should say "Username already taken, please try a different one" instead of generic "failed".
- Login error when no profile found should say "No account found -- please register" instead of "failed".
