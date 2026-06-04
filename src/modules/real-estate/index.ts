// Public API for the "real-estate" module.
// Other modules MUST import only from "@modules/real-estate", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/RealEstate package)
// without breaking consumers.

export { default as RealEstate } from "@/pages/deals/RealEstate";
