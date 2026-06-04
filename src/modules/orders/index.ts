// Public API for the "orders" module.
// Other modules MUST import only from "@modules/orders", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Orders package)
// without breaking consumers.

export { CartProvider, useCart } from "@/contexts/CartContext";
export { CartDrawerProvider, useCartDrawer } from "@/contexts/CartDrawerContext";
export { default as GlobalCartDrawer } from "@/components/GlobalCartDrawer";
export { default as OrderTracker } from "@/components/orders/OrderTracker";
export { default as OrderHistory } from "@/pages/pharmacy/OrderHistory";
export { default as OrderConfirmation } from "@/pages/pharmacy/OrderConfirmation";
