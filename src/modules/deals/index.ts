// Public API for the "deals" module.
// Other modules MUST import only from "@modules/deals", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Deals package)
// without breaking consumers.

export { default as Deals } from "@/pages/Deals";
export { default as Agriculture } from "@/pages/deals/Agriculture";
export { default as Tasks } from "@/pages/deals/Tasks";
