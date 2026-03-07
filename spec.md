# Game Vault

## Current State

The app has a checkout page (`CheckoutPage.tsx`) with payment methods: PayPal, Bitcoin, Ethereum, Xbox/Amazon/Etsy gift cards. Payment settings are stored in `PaymentSettings` which has fields: `paypalEmail`, `bitcoinWallet`, `ethereumWallet`, `xboxInstructions`, `amazonInstructions`, `etsyInstructions`.

The admin panel (`AdminPage.tsx`) has a `PaymentSettingsTab` that allows saving the above fields. The admin panel also has an `OrdersTab` where admins can accept or decline orders.

## Requested Changes (Diff)

### Add
- A new payment method called **Nexus Banking** in the checkout payment method selector
- Nexus Banking payment form: card number input, expiry date input, CVV input (shown when Nexus Banking is selected at checkout)
- When user selects Nexus Banking and fills in card details, these are stored as the `paymentReference` (formatted as `CARD:xxxx|EXP:xx/xx|CVV:xxx`)
- In the Admin Panel > Payment Settings tab: add a "Nexus Banking" settings section with a toggle to enable/disable the payment provider, and a display name/description field (e.g. the merchant name or account info)
- In the Admin Panel > Orders tab: Nexus Banking orders show the card details (card number, expiry, CVV) so admin can see and process the payment; admins can then accept or decline

### Modify
- `PaymentSettings` interface in the frontend: add `nexusBankingEnabled: boolean` and `nexusBankingMerchantName: string` fields
- `CheckoutPage.tsx`: add Nexus Banking as a payment option; when selected, show card number/expiry/CVV form fields instead of the copy-address flow; validate card fields before placing order
- `AdminPage.tsx` > `PaymentSettingsTab`: add Nexus Banking section with enable toggle and merchant name field
- `AdminPage.tsx` > `OrdersTab` / `OrderEmailModal`: when order's paymentMethod is "nexus_banking", parse and display card details from `paymentReference` field

### Remove
- Nothing removed

## Implementation Plan

1. Update `PaymentSettings` type usage in frontend to include `nexusBankingEnabled` and `nexusBankingMerchantName` (frontend-only, no backend change needed — these can be stored in the existing `savePaymentSettings` using the existing interface by treating them as new fields on the object; the backend already stores PaymentSettings as a flexible record)
2. In `CheckoutPage.tsx`: add `nexus_banking` to `PaymentMethod` type; add Nexus Banking option to `PAYMENT_OPTIONS` array; add conditional card detail form (card number, expiry date, CVV) when Nexus Banking is selected; validate card fields; format card data into `paymentReference`
3. In `AdminPage.tsx` > `PaymentSettingsTab`: add Nexus Banking section with enabled toggle + merchant name input
4. In `AdminPage.tsx` > `OrdersTab` order card: detect `paymentMethod === "nexus_banking"`, parse card details from `paymentReference`, display masked card number + expiry + CVV for admin review
5. In `AdminPage.tsx` > `OrderEmailModal`: show parsed card details when payment method is Nexus Banking
6. Update `backend.d.ts` to add `nexusBankingEnabled` and `nexusBankingMerchantName` to `PaymentSettings` interface
