import { test, expect, type Page } from '@playwright/test';

/**
 * Multilingual Phase 0 — transport + chrome end to end:
 * server-rendered locale, pre-paint restore + cookie sync, the
 * registry-driven header picker, translated chrome, reload persistence
 * and RTL direction.
 */

/**
 * Dispatch the picker selection directly: the home page saturates the
 * single-worker dev server and Playwright's real-click actionability
 * waits can outlive the test budget on this box. el.click() still runs
 * the full React handler path.
 */
async function tapLocale(page: Page, label: string): Promise<void> {
    await page
        .locator('details button', { hasText: label })
        .first()
        .evaluate((el) => (el as HTMLElement).click());
}

/** The versioned locale bundle the chrome needs after a switch. */
function bundleResponse(page: Page, locale: string) {
    return page.waitForResponse(
        (response) => response.url().includes('/i18n/') && response.url().endsWith(`/${locale}/common.json`),
        { timeout: 120_000 },
    );
}

test.beforeEach(async ({ page }) => {
    // Full navigations on the single-worker dev server can exceed the
    // global 30s budget under load.
    page.setDefaultNavigationTimeout(90_000);
});

test('server renders the resolved locale on first paint', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test('stored guest choice is restored pre-paint and synced into the locale cookie', async ({
    page,
    context,
}) => {
    test.slow(); // three full server navigations on the single-worker dev server
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => window.localStorage.setItem('everythingneed-language', 'fr'));
    await page.reload({ waitUntil: 'domcontentloaded' });

    // The pre-paint script applied the stored choice before first paint.
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

    // ...and mirrored it into the cookie so the server can resolve it.
    await expect
        .poll(async () => (await context.cookies()).find((c) => c.name === 'locale')?.value)
        .toBe('fr');

    // Next full server render agrees: Inertia props land on fr via cookie.
    // (Inertia 2 ships the page payload as JSON in a script tag.)
    await page.reload({ waitUntil: 'domcontentloaded' });
    const pageData = await page.locator('script[data-page]').first().textContent();
    expect(pageData).toContain('"locale":"fr"');
    expect(pageData).toContain('"localeSource":"cookie"');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});

test('header picker switches the chrome language and persists across reloads', async ({
    page,
}) => {
    test.slow(); // home render + reload on the single-worker dev server
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const frBundle = bundleResponse(page, 'fr');
    await tapLocale(page, 'Français');
    await frBundle;

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByPlaceholder('Tout rechercher...').first()).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByPlaceholder('Tout rechercher...').first()).toBeVisible();
});

test('arabic selection flips the document to RTL', async ({ page }) => {
    test.slow(); // home render + reload on the single-worker dev server
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const arBundle = bundleResponse(page, 'ar');
    await tapLocale(page, 'العربية');
    await arBundle;

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByPlaceholder('ابحث عن كل شيء...').first()).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});
