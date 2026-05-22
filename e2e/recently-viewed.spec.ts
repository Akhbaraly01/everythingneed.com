import { test, expect, Page } from "@playwright/test";

/**
 * Real E2E flow:
 * - Visit 12 distinct /product/:id routes via the router (not component mounting)
 * - Navigate back to "/" between each visit
 * - Assert Recently Viewed shows exactly 10 cards in newest-first order
 * - Hard reload "/" and assert the list survives
 */

const PRODUCT_IDS = Array.from({ length: 12 }, (_, i) => String(i + 1));

async function visitProduct(page: Page, id: string) {
  await page.goto(`/product/${id}`);
  // Wait for the route to actually mount the product detail page.
  // ProductDetail uses a "back" chevron + product content; we just wait for URL + network idle.
  await page.waitForURL(`**/product/${id}`);
  await page.waitForLoadState("networkidle");
}

async function goHome(page: Page) {
  await page.goto("/");
  await page.waitForURL((url) => url.pathname === "/");
  await page.waitForLoadState("networkidle");
}

test.describe("Recently Viewed — real browser E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Start from a clean slate so prior runs don't pollute the list.
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("12 product visits → home shows 10 cards in newest-first order", async ({ page }) => {
    for (const id of PRODUCT_IDS) {
      await visitProduct(page, id);
      await goHome(page);
    }

    const section = page.getByTestId("recently-viewed-list");
    await expect(section).toBeVisible();

    const items = section.getByTestId("recently-viewed-item");
    await expect(items).toHaveCount(10);

    // Newest-first: 12, 11, ..., 3
    const expected = [...PRODUCT_IDS].reverse().slice(0, 10);
    const actual = await items.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.productId),
    );
    expect(actual).toEqual(expected);

    // The two oldest must have been evicted.
    expect(actual).not.toContain("1");
    expect(actual).not.toContain("2");
  });

  test("survives a hard reload of the home page", async ({ page }) => {
    for (const id of PRODUCT_IDS) {
      await visitProduct(page, id);
      await goHome(page);
    }

    // Hard reload — discards in-memory React state, must rehydrate from localStorage.
    await page.reload({ waitUntil: "networkidle" });

    const items = page.getByTestId("recently-viewed-list").getByTestId("recently-viewed-item");
    await expect(items).toHaveCount(10);

    const expected = [...PRODUCT_IDS].reverse().slice(0, 10);
    const actual = await items.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.productId),
    );
    expect(actual).toEqual(expected);
  });
});
