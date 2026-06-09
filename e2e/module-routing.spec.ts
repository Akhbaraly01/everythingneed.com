import { test, expect } from "@playwright/test";

/**
 * Module routing smoke E2E.
 *
 * Guards the modular monolith: every module's public route fragment must
 * resolve and render. If anyone breaks a module barrel or removes a route
 * export, these tests fail fast in CI before reaching production.
 *
 * Covered modules: home, needs, learn, healthcare, users (account).
 */

type Probe = {
  module: string;
  path: string;
  // Pattern guaranteed to appear in DOM when the route resolves to the
  // expected module page (not the NotFound fallback).
  expect: RegExp;
  protected?: boolean;
};

const PUBLIC_PROBES: Probe[] = [
  { module: "home", path: "/", expect: /quick access|top experts|discover/i },
  { module: "needs", path: "/needs/health", expect: /need|request|category/i },
  { module: "learn", path: "/learn", expect: /learn|course|feed/i },
  { module: "healthcare", path: "/healthcare", expect: /your health, our priority/i },
  { module: "healthcare", path: "/healthcare/book", expect: /find a doctor/i },
  { module: "healthcare", path: "/healthcare/labs", expect: /lab|test/i },
];

const PROTECTED_PROBES: Probe[] = [
  // ProtectedRoute redirects unauthenticated visitors to /auth, which itself
  // is a valid resolution — proving the route exists in the module fragment.
  { module: "users", path: "/account", expect: /sign in|account/i, protected: true },
  { module: "users", path: "/account/orders", expect: /sign in|order/i, protected: true },
  { module: "users", path: "/account/wallet", expect: /sign in|wallet/i, protected: true },
  { module: "healthcare", path: "/healthcare/tickets", expect: /sign in|ticket/i, protected: true },
];

for (const probe of [...PUBLIC_PROBES, ...PROTECTED_PROBES]) {
  test(`[${probe.module}] ${probe.path} resolves to module route`, async ({ page }) => {
    await page.goto(probe.path);
    await page.waitForLoadState("domcontentloaded");
    // Never the SPA NotFound page.
    await expect(page.locator("body")).not.toContainText(/404|page not found/i);
    await expect(page.locator("body")).toContainText(probe.expect);
  });
}
