import { test, expect, type Page } from '@playwright/test';

/**
 * Multilingual transport + chrome end to end:
 * server-rendered locale, pre-paint restore + cookie sync, the
 * registry-driven header picker, reload persistence and RTL direction.
 *
 * The whole-page engine is engine-dependent:
 *   - proxy / off: the curated dictionary renders the chrome, so the
 *     translated placeholder is asserted.
 *   - google: the widget translates the document, so the dictionary stays
 *     in the source language (no double translation) and the machine
 *     translation is asserted through the `googtrans` cookie instead.
 */

/**
 * Open the language menu and dispatch the selection directly: the home
 * page saturates the single-worker dev server and Playwright's real-click
 * actionability waits can outlive the test budget on this box. el.click()
 * still runs the full React handler path.
 */
async function tapLocale(page: Page, label: string): Promise<void> {
    await page
        .locator('button[aria-haspopup="menu"]')
        .first()
        .evaluate((el) => (el as HTMLElement).click());

    const item = page.getByRole('menuitemradio', { name: label }).first();
    await item.waitFor({ state: 'visible' });
    await item.evaluate((el) => (el as HTMLElement).click());
}

/** The versioned locale bundle the chrome needs after a switch. */
function bundleResponse(page: Page, locale: string) {
    return page.waitForResponse(
        (response) => response.url().includes('/i18n/') && response.url().endsWith(`/${locale}/common.json`),
        { timeout: 120_000 },
    );
}

/** Whole-page engine the server resolved for this request. */
async function engine(page: Page): Promise<string> {
    const data = await page.locator('script[data-page]').first().textContent();

    return data?.match(/"autoTranslate":\{"engine":"([a-z]+)"/)?.[1] ?? 'off';
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
    context,
}) => {
    test.slow(); // home render + reload on the single-worker dev server
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const mode = await engine(page);

    // The target bundle is only fetched when the dictionary follows the
    // choice; in widget mode the dictionary stays in the source language.
    const frBundle = mode === 'google' ? null : bundleResponse(page, 'fr');
    await tapLocale(page, 'Français');
    await frBundle;

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

    // The choice is persisted for the next request.
    await expect
        .poll(async () => (await context.cookies()).find((c) => c.name === 'locale')?.value)
        .toBe('fr');

    if (mode === 'google') {
        // Widget mode: the widget owns the page translation, the classic
        // `googtrans` cookie is what keeps it across reloads.
        await expect
            .poll(async () =>
                (await context.cookies()).find((c) => c.name === 'googtrans')?.value ?? '',
            )
            .toContain('/en/fr');
    } else {
        // Dictionary mode: the curated chrome is already French.
        await expect(page.getByPlaceholder('Tout rechercher...').first()).toBeVisible();
    }

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect
        .poll(async () => (await context.cookies()).find((c) => c.name === 'locale')?.value)
        .toBe('fr');
});

test('currency choice converts the displayed prices and persists', async ({ page }) => {
    test.slow();
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page
        .locator('button[aria-haspopup="menu"]')
        .first()
        .evaluate((el) => (el as HTMLElement).click());

    const eur = page.getByRole('menuitemradio', { name: /EUR/ }).first();
    await eur.waitFor({ state: 'visible' });
    await eur.evaluate((el) => (el as HTMLElement).click());

    // The display currency is stored locally and reflected in the trigger.
    await expect
        .poll(async () =>
            page.evaluate(() => window.localStorage.getItem('everythingneed-currency')),
        )
        .toBe('EUR');

    const trigger = page.locator('button[aria-haspopup="menu"]').first();

    await expect
        .poll(async () => (await trigger.textContent()) ?? '')
        .toContain('EUR');
});

test('arabic selection flips the document to RTL', async ({ page }) => {
    test.slow(); // home render + reload on the single-worker dev server
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const mode = await engine(page);
    const arBundle = mode === 'google' ? null : bundleResponse(page, 'ar');
    await tapLocale(page, 'العربية');
    await arBundle;

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});
