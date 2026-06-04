// Public API for the "engagement" module.
// Other modules MUST import only from "@modules/engagement", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Engagement package)
// without breaking consumers.

export { useWishlist } from "@/hooks/useWishlist";
export { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
export { CompareProvider, useCompare } from "@/contexts/CompareContext";
export { default as CompareDrawer } from "@/components/compare/CompareDrawer";
export { default as Wishlist } from "@/pages/account/Wishlist";
export { default as RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
