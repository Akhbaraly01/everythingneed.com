// Public API for the "products" module.
// Other modules MUST import only from "@modules/products", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Products package)
// without breaking consumers.

export { default as ProductDetail } from "@/pages/product/ProductDetail";
export { default as ProductCard } from "@/components/ProductCard";
export { default as EnhancedProductGrid } from "@/components/home/EnhancedProductGrid";
export { default as MasonryProductGrid } from "@/components/home/MasonryProductGrid";
export { allHomeProducts } from "@/data/homeProductsData";
