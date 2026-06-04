// Public API for the "users" module.
// Other modules MUST import only from "@modules/users", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Users package)
// without breaking consumers.

export { default as AccountPage } from "@/pages/Account";
export { default as Dashboard } from "@/pages/account/Dashboard";
export { default as NotificationSettings } from "@/pages/account/NotificationSettings";
