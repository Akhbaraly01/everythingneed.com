// Public API for the "bookings" module.
// Other modules MUST import only from "@modules/bookings", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Bookings package)
// without breaking consumers.

export { default as BookingRequestForm } from "@/components/booking/BookingRequestForm";
export { default as InlineBookingForm } from "@/components/booking/InlineBookingForm";
export { default as BookingChat } from "@/components/chat/BookingChat";
export { default as BookingDeals } from "@/pages/deals/Booking";
