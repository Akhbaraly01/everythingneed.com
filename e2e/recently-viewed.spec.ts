import { test, expect } from "@playwright/test";
import {
  clearRecentlyViewed,
  corruptors,
  goHome,
  getRenderedOrder,
  visitProduct,
  waitForRecentlyViewedList,
} from "./helpers/recently-viewed";

/**
 * Real E2E flow:
 * - Visit 12 distinct /product/:id routes via the router (not component mounting)
 * - Navigate back to "/" between each visit
 * - Assert Recently Viewed shows exactly 10 cards in newest-first order
 * - Hard reload "/" and assert the list survives
 * - Corrupted localStorage resets and repopulates cleanly
 */

const PRODUCT_IDS = Array.from({ length: 12 }, (_, i) => String(i + 1));

test.describe("Recently Viewed — real browser E2E", () => {
  test.beforeEach(async ({ page }) => {
    await clearRecentlyViewed(page);
  });

  test("12 product visits → home shows 10 cards in newest-first order", async ({ page }) => {
    for (const id of PRODUCT_IDS) {
      await visitProduct(page, id);
      await goHome(page);
    }

    await waitForRecentlyViewedList(page, 10);
    const actual = await getRenderedOrder(page);

    const expected = [...PRODUCT_IDS].reverse().slice(0, 10);
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

    await waitForRecentlyViewedList(page, 10);
    const actual = await getRenderedOrder(page);
    expect(actual).toEqual([...PRODUCT_IDS].reverse().slice(0, 10));
  });

  test("corrupted localStorage (invalid JSON) resets gracefully and repopulates", async ({ page }) => {
    await corruptors.invalidJson(page);

    await expect(page.getByTestId("recently-viewed-list")).toHaveCount(0);
    await expect(page.getByTestId("recently-viewed-heading")).toHaveCount(0);

    for (const id of PRODUCT_IDS) {
      await visitProduct(page, id);
      await goHome(page);
    }

    await waitForRecentlyViewedList(page, 10);
    const actual = await getRenderedOrder(page);
    expect(actual).toEqual([...PRODUCT_IDS].reverse().slice(0, 10));
  });

  test("corrupted localStorage (wrong shape) resets gracefully", async ({ page }) => {
    await corruptors.wrongShape(page);
    // Hook may either render nothing or render zero items; both are acceptable.
    await expect(page.getByTestId("recently-viewed-item")).toHaveCount(0);
  });

  test("over-cap seed (>10 items) truncates to 10 on next interaction", async ({ page }) => {
    await corruptors.overCap(page);

    // Section renders with the seeded items (>10 allowed if hook tolerates it,
    // but a fresh add must enforce the 10-item cap).
    await visitProduct(page, "1");
    await goHome(page);

    await waitForRecentlyViewedList(page, 10);
    const actual = await getRenderedOrder(page);
    expect(actual).toHaveLength(10);
    expect(actual[0]).toBe("1");
  });
});
