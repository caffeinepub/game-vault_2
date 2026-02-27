# Game Vault

## Current State
The app is a gaming digital store with:
- Product listings (game accounts, downloadable files), subscriptions, coupons
- Order management (admin accept/decline, customer order history with downloads)
- Auth: user registration/login, admin PIN (2006) access
- Payment settings (PayPal, Bitcoin, Ethereum, gift cards)
- Ads system (image and text ads at top of storefront)
- Ad-free membership ($0.05/month)
- Aurora-style Xbox 360 blade menu

## Requested Changes (Diff)

### Add
- **PromotionRequest type**: stores id, submitterUsername, type (youtube/business), link, description, optional imageUrl, status (pending/accepted/declined), createdAt
- `submitPromotionRequest` backend function: logged-in users submit a promotion request
- `listAllPromotionRequests` backend function: admin lists all promotion requests
- `updatePromotionRequestStatus` backend function: admin accepts or declines a request
- **Promote button on storefront**: visible above the search bar, only for logged-in users; guests see a "Login to promote" prompt
- **Promotion request form**: 2-step form -- Step 1: choose YouTube Channel or Business; Step 2: fill in link, description, optional image URL
- **Admin Panel -- Promotion Requests section**: view all requests with type, link, description, image; accept/decline buttons; "Create Ad from Promotion" button that auto-fills the ad creation form AND copies text to clipboard

### Modify
- Admin Panel: add "Promotion Requests" tab/section
- Store page: add "Promote Your Business/Channel" button above the search bar

### Remove
- Nothing removed
