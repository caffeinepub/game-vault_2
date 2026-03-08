# Game Vault

## Current State
- Users log in via Internet Identity and the AuthPage handles registration/login.
- CheckoutPage already has Nexus Banking implemented in the frontend code, but it is gated behind `nexusBankingEnabled` flag from `paymentSettings`. The backend `PaymentSettings` type does NOT include Nexus Banking fields.
- `getCustomerOrders` in the backend checks for a user profile via caller principal and traps if not found, causing login/order loading failures for users whose profile lookup fails.
- The Nexus Banking option is hidden in checkout unless the admin toggles it on from Admin Panel > Payment Settings. The frontend correctly handles card number, expiry, CVV fields.

## Requested Changes (Diff)

### Add
- Nexus Bank payment should always be visible at checkout (not gated by a backend flag) since the admin shouldn't need to enable it separately.
- Nexus Bank card details form (card number, expiry, CVV) should be clearly shown at checkout when selected.

### Modify
- Fix `getCustomerOrders` backend function: remove the hard trap when profile is not found — instead allow the lookup to proceed (or just check username match more leniently), so logged-in users who lost their session profile can still load orders.
- Make Nexus Banking always available at checkout on the frontend (remove the `nexusBankingEnabled` filter gate).
- The Admin Panel already shows Nexus Banking card details in order view — keep that.
- AuthPage: Improve the login flow to not silently fail — surface better error states for returning users.

### Remove
- Nothing removed.

## Implementation Plan
1. Fix `getCustomerOrders` in `main.mo` to not trap when user profile not found via caller — just check username match or allow if profile lookup returns null (since the username is passed explicitly).
2. In `CheckoutPage.tsx`, remove the `nexusBankingEnabled` filter so Nexus Banking is always shown.
3. Ensure the Nexus Banking form (card number, expiry, CVV) is fully functional and visible when selected.
4. Improve `AuthPage.tsx` login error handling so users see clear messages if something fails.
