// Public API for the "notifications" module.
// Other modules MUST import only from "@modules/notifications", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Notifications package)
// without breaking consumers.

export { useNotifications } from "@/hooks/useNotifications";
export { usePushNotifications } from "@/hooks/usePushNotifications";
export { default as NotificationBell } from "@/components/notifications/NotificationBell";
export { default as NotificationCenter } from "@/components/notifications/NotificationCenter";
export { default as PushNotificationPrompt } from "@/components/notifications/PushNotificationPrompt";
