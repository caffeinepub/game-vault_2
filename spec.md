# Game Vault

## Current State
Game Vault is a digital gaming store built on ICP with React/TypeScript frontend and Motoko backend. It supports:
- User registration/login with account management
- Products (game accounts, downloadable files with Lua/APK attachments)
- Subscription packages (monthly bonus content)
- Coupon system (percentage/fixed discounts, per-user usage tracking)
- Orders with admin accept/decline flow and delivery email tracking
- Payment settings (PayPal, Bitcoin, Ethereum, UK gift cards)
- Aurora-style Xbox 360 blade navigation menu
- Animated sunset loading screen
- Product search bar

## Requested Changes (Diff)

### Add
- **Ad system**: Admins can create image/banner ads and text ads (title + description + link). Ads display at the top of the storefront for non-members.
- **Ad-Free Membership**: Users can purchase a monthly ad-free membership for $0.05/month (manual repurchase, no auto-renewal). Membership lasts 30 days and disables ads on the storefront. Payment methods: same as store (PayPal, Bitcoin, Ethereum, gift cards).
- **Admin: Ad Manager section**: Create/edit/delete ads (both image and text types), toggle ads active/inactive.
- **Membership purchase flow at checkout**: Users select payment method, copy address, submit order reference -- same flow as product checkout.
- **Membership status in user profile/account**: Shows active membership expiry date and a "Renew Membership" button.

### Modify
- **Storefront**: Show ads banner at the top if user is not an active member. Hide ads if user has active membership.
- **Admin Panel**: Add "Ads" section to the admin navigation.

### Remove
- Nothing removed.

## Implementation Plan
1. Add Ad and Membership types to backend Motoko
2. Implement backend functions: createAd, updateAd, deleteAd, listAds (admin), listActiveAds (public), createMembership order, checkMembershipStatus
3. Regenerate backend.d.ts
4. Add Ads display banner component at top of storefront (hidden for active members)
5. Add membership purchase page/modal with payment method selection and copy-address flow
6. Add "Ads" section to Admin Panel with ad creation form and ad list management
7. Show membership status and expiry in user profile

## UX Notes
- Ads appear as a slim banner/card at the very top of the store page, above the hero section
- Image ads show the uploaded image with optional link; text ads show title + description + link
- Membership purchase uses the exact same checkout UI pattern as product orders
- Active membership shows a badge in the user profile ("Ad-Free until [date]")
- Admin ad manager has toggle to activate/deactivate each ad without deleting it
