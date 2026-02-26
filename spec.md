# Game Vault

## Current State
The store page (StorePage.tsx) displays products in sections: Featured Products, CPM Gg Services, CPM Lua Scripts, and Bonus Content. There is no search functionality. Products are loaded from the backend and passed as props.

## Requested Changes (Diff)

### Add
- A search bar on the store page allowing users to search products by name
- Real-time filtering as the user types
- A "no products found" empty state when no results match

### Modify
- StorePage.tsx: add a search input below the hero section and above the Featured Products section; filter all product sections by the search query

### Remove
- Nothing

## Implementation Plan
1. Add `searchQuery` state to StorePage
2. Add a styled search input below the hero section
3. Derive `filteredProducts` by filtering `products` where `product.name.toLowerCase().includes(searchQuery.toLowerCase())`
4. Pass `filteredProducts` to all three product grid sections (Featured, CPM Services, CPM Lua Scripts)
5. Show a global "no results" message if `searchQuery` is non-empty and `filteredProducts.length === 0`
6. Packages (subscriptions) are not searchable -- keep them as-is

## UX Notes
- Search bar should be prominent, centered below the hero banner
- Placeholder: "Search products..."
- Clear button (X) when there is text in the field
- Filtering is instant/real-time (no submit button needed)
- Matching is case-insensitive on product name
