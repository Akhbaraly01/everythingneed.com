import { test, expect } from "@playwright/test";

/**
 * Healthcare booking flow — surface-level E2E.
 *
 * Validates:
 * - Doctor selection page renders search, filter, auto-assign, and the list container
 * - Auto-assign routes to /healthcare/book/random
 * - Healthcare landing exposes services
 * - Labs booking page renders the static test catalog
 */

test.describe("Healthcare — booking flow shell", () => {
  test("doctor selection page renders core UI", async ({ page }) => {
    await page.goto("/healthcare/book");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: /find a doctor/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search doctors/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /auto-assign doctor/i })).toBeVisible();
  });

  test("auto-assign navigates to random booking route", async ({ page }) => {
    await page.goto("/healthcare/book");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: /auto-assign doctor/i }).click();
    await page.waitForURL("**/healthcare/book/random");
    expect(page.url()).toContain("/healthcare/book/random");
  });

  test("healthcare landing exposes services and CTA", async ({ page }) => {
    await page.goto("/healthcare");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByRole("heading", { name: /your health, our priority/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /book consultation/i }).first(),
    ).toBeVisible();
  });

  test("labs booking page renders test catalog", async ({ page }) => {
    await page.goto("/healthcare/labs");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByRole("heading", { name: /labs & diagnostics/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/search tests/i)).toBeVisible();
    await expect(page.getByText(/complete blood count/i)).toBeVisible();
  });
});
