# Game Vault

## Current State
Full e-commerce store for digital gaming products. Users can register, browse products, checkout, and view orders in their dashboard. Admins can attach .lua and .apk files to products. When an order is accepted, a download section should appear in the user's order history. The download button is currently broken and does not appear.

## Requested Changes (Diff)

### Add
- Backend: a new `getOrderDownloadFiles(customerUsername, orderId)` query that takes a username + orderId, finds the matching order, looks up the product by name, and returns the list of files for that product — no permission check blocking anonymous callers
- Backend: remove the `#user` permission check from `downloadProductFile` so any logged-in user who has an accepted order for that product can download

### Modify
- Backend `downloadProductFile`: remove the `AccessControl.hasPermission` check that blocks all non-admin callers; keep the purchase verification (check that the caller's profile username has an accepted order for this product's name)
- Frontend `DashboardPage`: fix `canDownload` condition — remove the `products.length > 0` dependency; instead always render `OrderDownloadSection` for accepted orders and pass the product lookup directly by name via the backend `listProductFiles` call using the product name
- Frontend `OrderDownloadSection`: instead of requiring products array + matching by name, call `listProductFiles` using a new prop `productName` lookup against the products list; if no product found by name, still attempt to render (show nothing) without crashing

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate backend to fix `downloadProductFile` — remove `AccessControl.hasPermission` check, keep purchase ownership check using caller's profile
2. Update frontend `DashboardPage`:
   - Remove `products.length > 0` from `canDownload` check — only require `isAccepted && onListProductFiles && onDownloadFile`
   - The `OrderDownloadSection` already handles the "no product found" case by returning null
3. The `OrderDownloadSection` product lookup by name should also try case-insensitive trimmed match (already does lowercase, ensure it trims whitespace)
