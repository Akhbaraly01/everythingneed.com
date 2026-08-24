/**
 * DEV-only bridge that exposes the EventBus on `window` so Playwright E2E
 * tests can emit a cross-module event and assert a different module reacted.
 *
 * It also wires a tiny demo subscriber (notifications module sink) that
 * surfaces AppointmentBooked events into the DOM via a hidden marker
 * element with `data-testid="event-marker"`. That gives us a deterministic
 * cross-module assertion target without coupling production UI.
 *
 * Compiled out of production via `import.meta.env.DEV` guard at the call site.
 */
import { useEffect, useState } from "react";
import { eventBus } from "@core/events/EventBus";

export const EventBusDevBridge = () => {
  const [last, setLast] = useState<string>("");

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // Expose for E2E.
    (window as unknown as { __eventBus?: typeof eventBus }).__eventBus = eventBus;

    // Cross-module listener: notifications reacting to healthcare events.
    const off = eventBus.on("AppointmentBooked", (p) => {
      setLast(`appointment:${p.ticketId}`);
    });
    return () => {
      off();
    };
  }, []);

  if (!import.meta.env.DEV) return null;
  return (
    <div
      data-testid="event-marker"
      data-last-event={last}
      style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
    >
      {last}
    </div>
  );
};
