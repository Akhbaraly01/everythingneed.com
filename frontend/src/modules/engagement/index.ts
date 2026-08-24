// Public API for the "engagement" module.
export { default as CompareDrawer } from "./components/CompareDrawer";
export { default as RecentlyViewedSection } from "./components/RecentlyViewedSection";
export { default as Wishlist } from "./pages/Wishlist";
export { useWishlist } from "./hooks/useWishlist";
export { useRecentlyViewed } from "./hooks/useRecentlyViewed";
export { default as WishlistPage } from "./pages/WishlistPage";
export { CompareProvider, useCompare } from "./context/CompareContext";
