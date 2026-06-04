// Public API for the "pharmacy" module.
// Other modules MUST import only from "@modules/pharmacy", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Pharmacy package)
// without breaking consumers.

export { default as PharmacyPage } from "@/pages/pharmacy/PharmacyPage";
