import { test, expect, Page } from "@playwright/test";

/**
 * Real E2E flow:
 * - Visit 12 distinct /product/:id routes via the router (not component mounting)
 * - Navigate back to "/" between each visit
 * - Assert Recently Viewed shows exactly 10 cards in newest-first order
 * - Hard reload "/" and assert the list survives
 * - Corrupted localStorage resets and repopulates cleanly
 */

const STORAGE_KEY = "recently_viewed_products";
const PRODUCT_IDS = Array.from({ length: 12 }, (_, i) => String(i + 1));

async function visitProduct(page: Page, id: string) {
  await page.goto(`/product/${id}`);
  await page.waitForURL(`**/product/${id}`);
  // Stricter wait: DOM-ready over networkidle (more deterministic, less flaky).
  await page.waitForLoadState("domcontentloaded");
}

async function goHome(page: Page) {
  await page.goto("/");
  await page.waitForURL((url) => url.pathname === "/");
  await page.waitForLoadState("domcontentloaded");
}

async function waitForRecentlyViewed(page: Page, expectedCount: number) {
  // Hard-wait for the list container, then for the exact card count.
  await page.waitForSelector('[data-testid="recently-viewed-list"]', {
    state: "visible",
    timeout: 15_000,
  });
  const items = page
    .getByTestId("recently-viewed-list")
    .getByTestId("recently-viewed-item");
  await expect(items).toHaveCount(expectedCount);
  return items;
}

test.describe("Recently Viewed — real browser E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("12 product visits → home shows 10 cards in newest-first order", async ({ page }) => {
    for (const id of PRODUCT_IDS) {
      await visitProduct(page, id);
      await goHome(page);
    }

    const items = await waitForRecentlyViewed(page, 10);

    const expected = [...PRODUCT_IDS].reverse().slice(0, 10);
    const actual = await items.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.productId),
    );
    expect(actual).toEqual(expected);
    expect(actual).not.toContain("1");
    expect(actual).not.toContain("2");
  });

  test("survives a hard reload of the home page", async ({ page }) => {
    for (const id of PRODUCT_IDS) {
      await visitProduct(page, id);
      await goHome(page);
    }

    await page.reload({ waitUntil: "domcontentloaded" });

    const items = await waitForRecentlyViewed(page, 10);
    const expected = [...PRODUCT_IDS].reverse().slice(0, 10);
    const actual = await items.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.productId),
    );
    expect(actual).toEqual(expected);
  });

  test("corrupted localStorage resets gracefully and repopulates", async ({ page }) => {
    // Seed garbage into the storage key before any app code touches it.
    await page.goto("/");
    await page.evaluate((key) => {
      localStorage.setItem(key, "{not json");
    }, STORAGE_KEY);

    // Reload so the hook re-reads the corrupted value on mount.
    await page.reload({ waitUntil: "domcontentloaded" });

    // Section should not be present (no items, no crash).
    await expect(page.getByTestId("recently-viewed-list")).toHaveCount(0);
    await expect(page.getByTestId("recently-viewed-heading")).toHaveCount(0);

    // Now visit 12 products — eviction + ordering must still work.
    for (const id of PRODUCT_IDS) {
      await visitProduct(page, id);
      await goHome(page);
    }

    const items = await waitForRecentlyViewed(page, 10);
    const actual = await items.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.productId),
    );
    expect(actual).toEqual([...PRODUCT_IDS].reverse().slice(0, 10));

    // Storage is now valid JSON again.
    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(() => JSON.parse(stored || "")).not.toThrow();
    const parsed = JSON.parse(stored || "[]");
    expect(parsed).toHaveLength(10);
  });
});
