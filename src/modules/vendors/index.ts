// Public API for the "vendors" module.
// Other modules MUST import only from "@modules/vendors", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Vendors package)
// without breaking consumers.

export { default as VendorDashboard } from "@/pages/vendor/VendorDashboard";
export { default as EnhancedVendorDashboard } from "@/pages/vendor/EnhancedVendorDashboard";
export { default as VendorAnalytics } from "@/pages/vendor/VendorAnalytics";
export { default as VendorRegistration } from "@/pages/vendor/VendorRegistration";
