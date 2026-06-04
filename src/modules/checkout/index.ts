// Public API for the "checkout" module.
// Other modules MUST import only from "@modules/checkout", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Checkout package)
// without breaking consumers.

export { default as CheckoutPage } from "@/pages/pharmacy/CheckoutPage";
