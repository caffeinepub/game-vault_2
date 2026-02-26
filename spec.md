# Game Vault

## Current State
- Full gaming store with checkout, admin panel, user accounts, coupons, and order management.
- `UserProfile` has `username` and `email` fields.
- `Order` has `orderId`, `customerUsername`, `itemName`, `price`, `paymentMethod`, `paymentReference`, `status`, `timestamp`, `couponCode`.
- Checkout page collects a coupon code but does NOT collect or save a delivery email.
- Admin panel Orders tab shows `customerUsername`, price, payment method, payment reference -- but NOT the customer's email.
- Users register with a username + email, but email is not surfaced at checkout or in orders.
- DashboardPage shows the profile email but user cannot change it after registration.

## Requested Changes (Diff)

### Add
- `deliveryEmail` field on the `Order` type so each order records the email the admin should send the product to.
- Email input field on the CheckoutPage -- pre-filled from `userProfile.email` -- that is submitted with the order.
- After placing an order, save the entered email back to the user's profile (so it's pre-filled next time and persists).
- "Change Email" section in DashboardPage so the customer can update their delivery email at any time.
- Display `deliveryEmail` prominently on each order card in the Admin Panel Orders tab, with a mailto: link for easy clicking.

### Modify
- `placeOrder` backend call -- add a `deliveryEmail: Text` parameter.
- `Order` type in Motoko -- add `deliveryEmail: Text`.
- `updateOrderStatus` must preserve `deliveryEmail` when rebuilding the order record.
- `saveCallerUserProfile` is already available and used; no new backend method needed.
- CheckoutPage: add email input, wire it into `onPlaceOrder`, and after success call `saveCallerUserProfile` to persist the email.
- AdminPage OrdersTab: show customer email below the username, with a mailto: link.
- DashboardPage: add a small "Update Email" form below the profile header.
- App.tsx `handlePlaceOrder`: add `deliveryEmail` parameter and pass it through to `actor.placeOrder`.

### Remove
- Nothing removed.

## Implementation Plan
1. Regenerate Motoko backend with updated `Order` type (add `deliveryEmail` field) and updated `placeOrder` / `updateOrderStatus` signatures.
2. Update frontend:
   a. `CheckoutPage`: add email input pre-filled from `userProfile.email`; pass `deliveryEmail` to `onPlaceOrder`; after order success call `actor.saveCallerUserProfile` to persist email.
   b. `AdminPage` OrdersTab: show `order.deliveryEmail` with a mailto: link on each order card.
   c. `DashboardPage`: add "Update Email" inline form -- user can edit email and save via `onUpdateEmail` prop.
   d. `App.tsx`: update `handlePlaceOrder` signature to accept `deliveryEmail` and pass it through; add `handleUpdateEmail` callback that calls `actor.saveCallerUserProfile` and updates local `userProfile` state.

## UX Notes
- Email field at checkout should say "Delivery Email -- we'll use this to send your order" with placeholder `your@email.com`.
- It should be pre-filled from `userProfile.email` if available.
- If the user changes it at checkout, the new email is saved to their profile automatically after the order is placed.
- In the admin panel orders view, the email should appear on each order row so the admin can click to open their email client.
- In the dashboard, a small "Update Email" section with an input and Save button, below the profile card.
