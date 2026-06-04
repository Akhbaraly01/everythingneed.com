// Public API for the "settings" module.
// Other modules MUST import only from "@modules/settings", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Settings package)
// without breaking consumers.

export { CurrencyProvider, useCurrency } from "@/contexts/CurrencyContext";
export { useTranslation } from "@/hooks/useTranslation";
