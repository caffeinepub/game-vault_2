# Game Vault

## Current State
Full-stack gaming digital store with products, subscriptions/packages, basket, checkout, coupon system, downloadable files, ads, memberships, and admin panel (PIN: 2006).

The backend has `AccessControl.hasPermission(accessControlState, caller, #user)` checks on several functions (`placeOrder`, `getCustomerOrders`, `getMembershipStatus`, `purchaseMembership`, `submitPromotionRequest`). Since Internet Identity users are never assigned the `#user` role in the access control system, every logged-in user is blocked from placing orders, viewing orders, viewing memberships, purchasing memberships, and submitting promotions. This causes products to appear not to load after items are added to the basket, and subscriptions to not work.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Remove `AccessControl.hasPermission(accessControlState, caller, #user)` checks from: `placeOrder`, `getCustomerOrders`, `getMembershipStatus`, `purchaseMembership`, `submitPromotionRequest`
- Keep all other authorization logic (username match checks, admin checks via `AccessControl.isAdmin`)
- Keep admin-only checks for admin functions untouched

### Remove
- The blocking `#user` permission checks that prevent logged-in users from accessing their own data

## Implementation Plan
1. Regenerate backend Motoko removing the 5 blocking `#user` permission checks while keeping all other logic identical
2. Keep frontend unchanged -- no frontend changes needed
