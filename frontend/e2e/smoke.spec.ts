import { expect, test } from "@playwright/test";

/**
 * Core smoke coverage for the EverythingNeed SPA.
 * These specs are intentionally resilient to backend availability:
 * every asserted surface renders a static shell even when API calls fail
 * (pages degrade gracefully by design).
 */

test.describe("EverythingNeed smoke", () => {
  test("home page renders the app shell", async ({ page }) => {
    await page.goto("/");
    // App shell mounts regardless of backend availability
    await expect(page.locator("#root")).not.toBeEmpty();
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test("auth page renders login form controls", async ({ page }) => {
    await page.goto("/auth");
    // Either the email input or a sign-in heading must be present
    const email = page.locator('input[type="email"], input[name="email"]');
    const heading = page.getByText(/sign in|log ?in|welcome/i).first();
    expect(
      (await email.count()) > 0 || (await heading.isVisible().catch(() => false)),
    ).toBeTruthy();
  });

  test("deals landing renders category content or graceful fallback", async ({ page }) => {
    await page.goto("/deals");
    await expect(page.locator("#root")).not.toBeEmpty();
    // Must NOT show a blank white screen
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test("healthcare landing renders its shell", async ({ page }) => {
    await page.goto("/healthcare");
    await expect(page.locator("#root")).not.toBeEmpty();
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test("unknown route shows the not-found experience", async ({ page }) => {
    await page.goto("/definitely-not-a-real-page-xyz");
    await expect(page.locator("body")).toContainText(/not found|404|page.*exist/i);
  });

  test("no uncaught console errors crash the shell on home", async ({ page }) => {
    const fatal = [];
    page.on("pageerror", (err) => fatal.push(err.message));
    await page.goto("/");
    await page.waitForTimeout(1500);
    // React error boundaries / white-screen crashes manifest as pageerror
    expect(fatal.filter((m) => /minified react error|cannot read/i.test(m))).toHaveLength(0);
  });
});
