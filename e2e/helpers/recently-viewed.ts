import { Page, expect, Locator } from "@playwright/test";

/**
 * Reusable helpers for Recently Viewed E2E tests.
 * Centralizes storage seeding, eviction edge cases, and stable list assertions.
 */

export const RECENTLY_VIEWED_STORAGE_KEY = "recently_viewed_products";

export type SeedItem = {
  id: string;
  name?: string;
  image?: string;
  price?: number;
  category?: string;
  viewedAt?: number;
};

/** Wipe storage so a test starts from a clean slate. */
export async function clearRecentlyViewed(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), RECENTLY_VIEWED_STORAGE_KEY);
}

/**
 * Seed an arbitrary, well-formed list of items into localStorage. The first
 * item is treated as "most recent". Reloads the page so the hook re-reads it.
 */
export async function seedRecentlyViewed(page: Page, items: SeedItem[]) {
  await page.goto("/");
  await page.evaluate(
    ({ key, items }) => {
      const now = Date.now();
      const payload = items.map((it, idx) => ({
        id: it.id,
        name: it.name ?? `Product ${it.id}`,
        image: it.image ?? `/img/${it.id}.jpg`,
        price: it.price ?? 0,
        category: it.category ?? "Electronics",
        viewedAt: it.viewedAt ?? now - idx * 1000,
      }));
      localStorage.setItem(key, JSON.stringify(payload));
    },
    { key: RECENTLY_VIEWED_STORAGE_KEY, items },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
}

/** Edge-case seeders for hardening tests. */
export const corruptors = {
  /** Invalid JSON — hook should swallow and start empty. */
  invalidJson: async (page: Page) => {
    await page.goto("/");
    await page.evaluate(
      (key) => localStorage.setItem(key, "{not json"),
      RECENTLY_VIEWED_STORAGE_KEY,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
  },
  /** Wrong shape — string instead of array. */
  wrongShape: async (page: Page) => {
    await page.goto("/");
    await page.evaluate(
      (key) => localStorage.setItem(key, JSON.stringify("oops")),
      RECENTLY_VIEWED_STORAGE_KEY,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
  },
  /** Over-cap (15 items) — should be truncated to 10 after next add. */
  overCap: async (page: Page) => {
    const items: SeedItem[] = Array.from({ length: 15 }, (_, i) => ({ id: String(100 + i) }));
    await seedRecentlyViewed(page, items);
  },
  /** Empty array — section should not render. */
  empty: async (page: Page) => {
    await page.goto("/");
    await page.evaluate(
      (key) => localStorage.setItem(key, "[]"),
      RECENTLY_VIEWED_STORAGE_KEY,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
  },
};

/**
 * Wait for the Recently Viewed list to render with exactly `expectedCount`
 * items, then return the locator. Uses deterministic data-testid selectors
 * and waits for stable DOM (count holds for two consecutive frames).
 */
export async function waitForRecentlyViewedList(
  page: Page,
  expectedCount: number,
): Promise<Locator> {
  await page.waitForSelector('[data-testid="recently-viewed-list"]', {
    state: "visible",
    timeout: 15_000,
  });
  const items = page
    .getByTestId("recently-viewed-list")
    .getByTestId("recently-viewed-item");
  await expect(items).toHaveCount(expectedCount);

  // Stability check: ensure count is steady across an animation frame.
  // Guards against Framer Motion mount races on slower CI runners.
  await page.waitForFunction(
    (expected) =>
      document.querySelectorAll('[data-testid="recently-viewed-item"]').length === expected,
    expectedCount,
    { timeout: 5_000 },
  );
  return items;
}

/** Read the rendered product-id order from the Recently Viewed list. */
export async function getRenderedOrder(page: Page): Promise<(string | undefined)[]> {
  const items = page
    .getByTestId("recently-viewed-list")
    .getByTestId("recently-viewed-item");
  return items.evaluateAll((els) =>
    els.map((el) => (el as HTMLElement).dataset.productId),
  );
}

/** Navigate to a product detail page and wait for DOM-ready. */
export async function visitProduct(page: Page, id: string) {
  await page.goto(`/product/${id}`);
  await page.waitForURL(`**/product/${id}`);
  await page.waitForLoadState("domcontentloaded");
}

/** Navigate to the home page and wait for DOM-ready. */
export async function goHome(page: Page) {
  await page.goto("/");
  await page.waitForURL((url) => url.pathname === "/");
  await page.waitForLoadState("domcontentloaded");
}
