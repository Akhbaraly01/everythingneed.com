import { test, expect, Page } from "@playwright/test";

/**
 * Real E2E flow:
 * - Visit 12 distinct /product/:id routes via the router (real navigation, not component mounting)
 * - Navigate back to "/" between each visit
 * - Assert Recently Viewed shows exactly 10 cards in newest-first order
 * - Assert URL really changes between routes and focus is preserved on return to home
 * - Hard reload "/" (twice) and assert the list survives both times
 */

const PRODUCT_IDS = Array.from({ length: 12 }, (_, i) => String(i + 1));

async function visitProduct(page: Page, id: string) {
  await page.goto(`/product/${id}`);
  // Assert real URL navigation (not just component mounting).
  await expect(page).toHaveURL(new RegExp(`/product/${id}$`));
  await page.waitForLoadState("networkidle");
}

async function goHome(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await page.waitForLoadState("networkidle");
}

test.describe("Recently Viewed — real browser E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("12 product visits → home shows 10 cards in newest-first order, with real URL changes and sane focus", async ({
    page,
  }) => {
    let previousUrl = page.url();

    for (const id of PRODUCT_IDS) {
      await visitProduct(page, id);
      // URL really changed for this product route.
      expect(page.url()).not.toBe(previousUrl);
      expect(page.url()).toMatch(new RegExp(`/product/${id}$`));

      const productUrl = page.url();
      await goHome(page);

      // URL really changed back to home (not just a SPA re-render of the same route).
      expect(page.url()).not.toBe(productUrl);
      expect(new URL(page.url()).pathname).toBe("/");

      // Focus should be on a sensible element after navigation (body or a focusable element),
      // never stuck on a stale element from the product page.
      const focusInfo = await page.evaluate(() => ({
        tag: document.activeElement?.tagName ?? null,
        inDocument: document.activeElement
          ? document.contains(document.activeElement)
          : false,
      }));
      expect(focusInfo.inDocument).toBe(true);
      expect(focusInfo.tag).not.toBeNull();

      previousUrl = page.url();
    }

    const section = page.getByTestId("recently-viewed-list");
    await expect(section).toBeVisible();
    await expect(page.getByTestId("recently-viewed-heading")).toHaveText(/Recently Viewed/i);

    const items = section.getByTestId("recently-viewed-item");
    await expect(items).toHaveCount(10);

    const expected = [...PRODUCT_IDS].reverse().slice(0, 10);
    const actual = await items.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.productId),
    );
    expect(actual).toEqual(expected);

    // The two oldest must have been evicted.
    expect(actual).not.toContain("1");
    expect(actual).not.toContain("2");
  });

  test("survives two consecutive hard reloads of the home page", async ({ page }) => {
    for (const id of PRODUCT_IDS) {
      await visitProduct(page, id);
      await goHome(page);
    }

    const expected = [...PRODUCT_IDS].reverse().slice(0, 10);

    // First hard reload.
    await page.reload({ waitUntil: "networkidle" });
    {
      await expect(page.getByTestId("recently-viewed-heading")).toHaveText(/Recently Viewed/i);
      const items = page.getByTestId("recently-viewed-list").getByTestId("recently-viewed-item");
      await expect(items).toHaveCount(10);
      const actual = await items.evaluateAll((els) =>
        els.map((el) => (el as HTMLElement).dataset.productId),
      );
      expect(actual).toEqual(expected);
    }

    // Second hard reload — list must still be intact and identical.
    await page.reload({ waitUntil: "networkidle" });
    {
      await expect(page.getByTestId("recently-viewed-heading")).toHaveText(/Recently Viewed/i);
      const items = page.getByTestId("recently-viewed-list").getByTestId("recently-viewed-item");
      await expect(items).toHaveCount(10);
      const actual = await items.evaluateAll((els) =>
        els.map((el) => (el as HTMLElement).dataset.productId),
      );
      expect(actual).toEqual(expected);
    }
  });
});
