// Public API for the "rides" module.
// Other modules MUST import only from "@modules/rides", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Rides package)
// without breaking consumers.

export { default as Transportation } from "@/pages/deals/Transportation";
