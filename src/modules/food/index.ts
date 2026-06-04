// Public API for the "food" module.
// Other modules MUST import only from "@modules/food", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Food package)
// without breaking consumers.

export { default as FoodDeals } from "@/pages/deals/Food";
