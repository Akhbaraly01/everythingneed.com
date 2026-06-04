// Public API for the "admin" module.
// Other modules MUST import only from "@modules/admin", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Admin package)
// without breaking consumers.

export { default as AdminDashboard } from "@/pages/admin/AdminDashboard";
export { default as SuperAdminDashboard } from "@/pages/admin/SuperAdminDashboard";
export { default as CategoryAdminDashboard } from "@/pages/admin/CategoryAdminDashboard";
