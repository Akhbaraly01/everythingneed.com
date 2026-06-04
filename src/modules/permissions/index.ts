// Public API for the "permissions" module.
// Other modules MUST import only from "@modules/permissions", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Permissions package)
// without breaking consumers.

export {};
