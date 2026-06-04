// Public API for the "analytics" module.
// Other modules MUST import only from "@modules/analytics", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Analytics package)
// without breaking consumers.

export {};
