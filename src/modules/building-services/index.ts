// Public API for the "building-services" module.
// Other modules MUST import only from "@modules/building-services", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/BuildingServices package)
// without breaking consumers.

export { default as BuildingServices } from "@/pages/BuildingServices";
