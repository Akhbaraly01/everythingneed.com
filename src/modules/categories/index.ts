// Public API for the "categories" module.
// Other modules MUST import only from "@modules/categories", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Categories package)
// without breaking consumers.

export { default as CategoryGrid } from "@/components/CategoryGrid";
export { QuickAccessGrid } from "@/components/home/QuickAccessGrid";
