/**
 * Laravel Echo client bound to the Reverb websocket server.
 *
 * Authentication uses the Sanctum bearer token so private channels
 * (user/chat/ticket/order) are authorized against the backend.
 */
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { logger } from "@core/logging";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let echo: Echo<any> | null = null;

function authToken(): string | null {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

export function echoInstance(): Echo<any> | null {
  if (echo) return echo;

  const key = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
  const host = (import.meta.env.VITE_REVERB_HOST as string | undefined) ?? "localhost";
  const port = Number((import.meta.env.VITE_REVERB_PORT as string | undefined) ?? 8081);
  const scheme = (import.meta.env.VITE_REVERB_SCHEME as string | undefined) ?? "http";

  if (!key) {
    logger.warn("[echo]", "Reverb key missing — realtime disabled");
    return null;
  }

  // Reverb speaks the pusher protocol
  (window as unknown as Record<string, unknown>).Pusher = Pusher;

  echo = new Echo({
    broadcaster: "reverb",
    key,
    wsHost: host,
    wsPort: port,
    wssPort: scheme === "https" ? port : undefined,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: "/api/broadcasting/auth",
    auth: {
      headers: {
        Authorization: authToken() ? `Bearer ${authToken()}` : "",
        Accept: "application/json",
      },
    },
  }) as unknown as Echo<any>;

  return echo;
}

/** Tear down when a user logs out so channels aren't shared across sessions. */
export function disconnectEcho(): void {
  if (echo) {
    try {
      echo.disconnect();
    } catch {
      // ignore
    }
    echo = null;
  }
}

// ── Typed channel helpers ──────────────────────────────────────────

type Unsubscribe = () => void;

export function listenToUserChannel(
  userId: string,
  onNotification: (payload: Record<string, unknown>) => void
): Unsubscribe {
  const instance = echoInstance();
  if (!instance || !userId) return () => {};

  return instance
    .private(`user.${userId}`)
    .listen(".notification.created", (payload: Record<string, unknown>) => {
      onNotification(payload);
    });
}

export function listenToTicketChannel(
  ticketId: string,
  onReply: (payload: Record<string, unknown>) => void
): Unsubscribe {
  const instance = echoInstance();
  if (!instance || !ticketId) return () => {};

  return instance
    .private(`ticket.${ticketId}`)
    .listen(".ticket.replied", (payload: Record<string, unknown>) => {
      onReply(payload);
    });
}

export function listenToChatChannel(
  conversationId: string,
  onMessage: (payload: Record<string, unknown>) => void
): Unsubscribe {
  const instance = echoInstance();
  if (!instance || !conversationId) return () => {};

  return instance
    .private(`chat.${conversationId}`)
    .listen(".message.sent", (payload: Record<string, unknown>) => {
      onMessage(payload);
    });
}

export function listenToOrderChannel(
  orderId: string,
  onUpdate: (payload: Record<string, unknown>) => void
): Unsubscribe {
  const instance = echoInstance();
  if (!instance || !orderId) return () => {};

  return instance
    .private(`order.${orderId}`)
    .listen(".order.status.updated", (payload: Record<string, unknown>) => {
      onUpdate(payload);
    });
}
