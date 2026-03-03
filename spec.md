# Game Vault

## Current State
- Full digital gaming store with products, subscriptions, coupons, ads, memberships, and promotions
- Checkout supports a single `CheckoutItem` (one product at a time)
- `types.ts` has `CheckoutItem` with id, name, price, isPackage
- `StorePage` and `ProductDetailPage` call `onSelectCheckoutItem` with a single item then navigate to checkout
- `CheckoutPage` handles one item with optional coupon
- `App.tsx` holds `checkoutItem: CheckoutItem | null` state

## Requested Changes (Diff)

### Add
- **Shopping basket/cart** system that lets users add multiple different products and control per-item quantities
- **Basket state** in `App.tsx` — an array of cart items (product id, name, price, quantity, isPackage)
- **BasketPage** component — shows all basket items, quantity controls (increment/decrement/remove), running total, and a "Proceed to Checkout" button
- **"Add to Basket"** button on product cards in `StorePage` and on `ProductDetailPage` (in addition to "Buy Now")
- **Basket icon/counter** in `Navbar` showing current item count, clicking navigates to basket
- **"basket"** page added to `Page` type
- Checkout updated to handle multiple items — `CheckoutItem` becomes a basket item or an array

### Modify
- `types.ts` — extend `CheckoutItem` to support qty, or add a new `BasketItem` type; add `"basket"` to `Page` union
- `App.tsx` — replace single `checkoutItem` with basket array; pass basket actions to `StorePage`, `ProductDetailPage`, `BasketPage`; add basket page render
- `StorePage` — add "Add to Basket" button alongside "Buy Now" on each product card
- `Navbar` — add basket icon with item count badge
- `CheckoutPage` — accept either a single item or an array of items; show all basket items in order summary; coupon applies to total
- `ProductDetailPage` — add "Add to Basket" button

### Remove
- Nothing removed; "Buy Now" (single item fast checkout) stays alongside basket

## Implementation Plan
1. Update `types.ts` — add `BasketItem` type with id, name, price, quantity, isPackage; add `"basket"` to Page
2. Update `App.tsx` — add basket state (array of BasketItem), handlers for addToBasket/removeFromBasket/updateQuantity/clearBasket; wire to all pages; add BasketPage render
3. Update `CheckoutPage` — accept `items: BasketItem[]` instead of single item; show all items in summary; total is sum of all items * quantities; coupon applies to total
4. Create `BasketPage.tsx` — list all basket items with quantity controls, subtotal per item, grand total, checkout button, empty state
5. Update `StorePage` — add "Add to Basket" button on each ProductCard
6. Update `ProductDetailPage` — add "Add to Basket" button
7. Update `Navbar` — add basket icon with count badge, clicking navigates to basket
8. Update `AuroraMenu` — add basket link
