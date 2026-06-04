// Public API for the "roles" module.
// Other modules MUST import only from "@modules/roles", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Roles package)
// without breaking consumers.

export type AppRole = "super_admin" | "category_admin" | "customer_service" | "user";
