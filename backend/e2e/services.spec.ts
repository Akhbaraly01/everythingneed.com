import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

// Mega M-2/M-3: taxonomy-backed services catalogue. Public grid (7 icons +
// See more), slug filtering (category + subcategories), live detail pages and
// the booking CTA gate, plus the admin taxonomy console.

const SUPER = { email: 'super@everythingneed.com', passwords: ['password', 'Password1'] };

const DETAIL_URL = /\/services\/[0-9a-fA-F-]{36}$/;

test('taxonomy grid filters to a service and opens its detail page', async ({ page }) => {
    await page.goto('/services', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('service-icon-grid')).toBeVisible();
    await expect(page.getByTestId('service-tile-home-cleaning')).toBeVisible();

    const tiles = page.locator('[data-testid^="service-tile-"]');
    expect(await tiles.count()).toBeGreaterThanOrEqual(7);

    const seeMore = page.getByTestId('service-see-more');
    if (await seeMore.isVisible()) {
        await seeMore.click();
        await expect(tiles.first()).toBeVisible();
    }

    await page.getByTestId('service-tile-home-cleaning').first().click();
    await page.waitForURL(/\/services\?category=home-cleaning/);

    await expect(page.getByText('Home Deep Cleaning').first()).toBeVisible();
    await page.getByTestId('service-card').first().click();
    await page.waitForURL(DETAIL_URL);

    await expect(page.getByTestId('service-detail-name')).toBeVisible();
    await expect(page.getByTestId('service-detail-name')).toContainText('Home Deep Cleaning');
});

test('guest sees the login CTA instead of the booking form', async ({ page }) => {
    await page.goto('/services?category=home-cleaning', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('service-card').first().click();
    await page.waitForURL(DETAIL_URL);

    await expect(page.getByTestId('book-service-login')).toBeVisible();
    await expect(page.getByTestId('booking-notes')).toHaveCount(0);
    await expect(page.getByTestId('book-service-btn')).toHaveCount(0);
});

test('home services rail links to a live detail page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const rail = page.locator('a[href^="/services/"]').first();
    if ((await rail.count()) === 0) {
        test.skip(true, 'no services rail rendered on this home layout');
    }
    await rail.scrollIntoViewIfNeeded();
    await rail.click();
    await page.waitForURL(DETAIL_URL);
    await expect(page.getByTestId('service-detail-name')).toBeVisible();
});

test.describe('admin taxonomy console', () => {
    // eslint-disable-next-line no-empty-pattern
    test.beforeEach(async ({}, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium', 'admin console is desktop-only');
    });

    test('categories tab CRUD and service form taxonomy select', async ({ page, request }) => {
        const stamp = Date.now();
        const name = `E2E Services ${stamp}`;
        const slug = `e2e-services-${stamp}`;
        const token = await apiLogin(request, SUPER);
        const auth = { Authorization: `Bearer ${token}` };

        try {
            // webLogin keeps the app's own post-login redirect; navigate to
            // the console page explicitly (same pattern as admin.spec.ts).
            await webLogin(page, SUPER, '/admin/dashboard');
            await page.goto('/admin/services', { waitUntil: 'domcontentloaded' });
            await expect(page.getByTestId('tab-categories')).toBeVisible({ timeout: 15_000 });

            await page.getByTestId('tab-categories').click();
            await expect(page.getByTestId('category-row-home-cleaning')).toBeVisible();
            await expect(page.getByTestId('category-row-deep-cleaning')).toBeVisible();

            await page.getByTestId('new-service-category').click();
            await page.getByTestId('category-name-input').fill(name);
            await page.getByPlaceholder('lowercase-hyphens').fill(slug);
            await page.getByTestId('save-category').click();
            await expect(page.getByTestId(`category-row-${slug}`)).toBeVisible({ timeout: 15_000 });

            await page.getByTestId('tab-services').click();
            await page.getByRole('button', { name: 'New Service' }).click();
            const select = page.getByTestId('service-category-select');
            await expect(select).toBeVisible();
            await expect(select.locator('option', { hasText: 'Home Cleaning' }).first()).toHaveCount(1);
            await select.selectOption({ label: '— Deep Cleaning' });
            await expect(select).toHaveValue(/.+/);
            await page.getByRole('button', { name: 'Cancel' }).click();
            await expect(select).toHaveCount(0);
        } finally {
            const res = await request.get('/api/admin/service-categories', { headers: auth, timeout: 15_000 });
            const body = await res.json();
            const flat = (body.data as Array<{ id: string; slug: string; children?: Array<{ id: string; slug: string }> }>)
                .flatMap((root) => [root, ...(root.children ?? [])]);
            const created = flat.find((c) => c.slug === slug);
            if (created) {
                await request.delete(`/api/admin/service-categories/${created.id}`, { headers: auth, timeout: 15_000 });
            }
        }
    });
});
