// Public API for the "hotels" module.
// Other modules MUST import only from "@modules/hotels", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Hotels package)
// without breaking consumers.

export { default as Hotels } from "@/pages/deals/Hotels";
export { default as HotelCard } from "@/components/booking/HotelCard";
