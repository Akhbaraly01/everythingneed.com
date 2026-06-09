import { test, expect } from "@playwright/test";

/**
 * Cross-module contract test.
 *
 * Healthcare module emits `AppointmentBooked` via the shared EventBus.
 * Notifications module (via the dev bridge) subscribes and updates the DOM.
 * We assert the update happens WITHOUT either module importing the other.
 */
test.describe("Cross-module EventBus contract", () => {
  test("AppointmentBooked propagates to notifications listener", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-testid='event-marker']")).toBeAttached();

    await page.evaluate(() => {
      // @ts-expect-error dev-only bridge
      window.__lovableEventBus.emit("AppointmentBooked", {
        ticketId: "tkt_e2e_123",
        doctorId: null,
        userId: "user_e2e",
      });
    });

    await expect(page.locator("[data-testid='event-marker']")).toHaveAttribute(
      "data-last-event",
      "appointment:tkt_e2e_123",
    );
  });
});
