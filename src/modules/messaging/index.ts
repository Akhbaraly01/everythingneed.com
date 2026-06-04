// Public API for the "messaging" module.
// Other modules MUST import only from "@modules/messaging", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Messaging package)
// without breaking consumers.

export { default as RealtimeChat } from "@/components/chat/RealtimeChat";
export { default as AIChatBot } from "@/components/chat/AIChatBot";
export { default as TicketList } from "@/pages/support/TicketList";
export { default as TicketDetail } from "@/pages/support/TicketDetail";
export { default as CreateTicket } from "@/pages/support/CreateTicket";
