import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

/**
 * Vendor product video journey (desktop-only project - the vendor portal is
 * a console-style flow). Covers the two paths that previously had no browser
 * evidence:
 *
 * 1. The vendor "Add Product" form (which never sent vendor_id - the API
 *    default now resolves it for single-vendor accounts) round-trips through
 *    the real API and lands in the vendor products list.
 * 2. A published product with a video_url renders the in-app player on the
 *    public storefront detail page (data-testid="product-video").
 */

// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'vendor portal is desktop-only');
});

// Seeded vendor: admin@ owns TechStore (electronics). Same matrix-style
// password fallbacks used by the fulfilment logins in admin.spec.ts.
const VENDOR = { email: 'admin@everythingneed.com', passwords: ['Password1', 'password'] };
const SUPER = { email: 'super@everythingneed.com', passwords: ['password', 'Password1'] };

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

test('vendor creates a product with a video URL from the portal form', async ({ page }) => {
    await webLogin(page, VENDOR, '/vendor/products');
    await page.goto('/vendor/products/create', { waitUntil: 'domcontentloaded' });

    const name = `E2E Video Product ${Date.now()}`;
    await page.getByTestId('product-name').fill(name);
    await page.getByTestId('product-category').fill('electronics');
    await page.getByTestId('product-price').fill('19.99');
    await page.getByTestId('product-stock').fill('5');
    await page.getByTestId('product-video-link-toggle').click();
    await page
        .getByTestId('product-video-url')
        .fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.getByRole('button', { name: 'Use link' }).click();

    // The submit button waits for the vendor profile (/api/vendors/mine) to
    // resolve so the payload always carries vendor_id.
    await expect(page.getByTestId('product-submit')).toBeEnabled({ timeout: 15_000 });
    await page.getByTestId('product-submit').click();

    // Success routes back to the vendor products list with the row visible.
    await page.waitForURL('**/vendor/products', { timeout: 20_000 });
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
});

test('vendor creates a product from the products-page modal', async ({ page }) => {
    await webLogin(page, VENDOR, '/vendor/products');
    await page.goto('/vendor/products', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Add product' }).click();
    const name = `E2E Modal Product ${Date.now()}`;
    await page.getByPlaceholder('Product name').fill(name);
    await page.getByPlaceholder('Category (e.g. electronics)').fill('electronics');
    await page.getByPlaceholder('Price').fill('12.34');
    await page.getByPlaceholder('Stock').fill('4');

    // Waits for /api/vendors/mine so the payload carries vendor_id.
    const submit = page.getByRole('button', { name: 'Create product' });
    await expect(submit).toBeEnabled({ timeout: 15_000 });
    await submit.click();

    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
});

test('published product with a video URL plays in-app on the storefront', async ({
    page,
    request,
}) => {    const adminToken = await apiLogin(request, SUPER);

    const vendors = await request.get('/api/vendors');
    expect(vendors.ok()).toBeTruthy();
    const vendorId = (await vendors.json()).data[0].id as string;

    const created = await request.post('/api/products', {
        headers: bearer(adminToken),
        data: {
            vendor_id: vendorId,
            name: `E2E Storefront Video ${Date.now()}`,
            category: 'electronics',
            price: 24.99,
            stock_quantity: 3,
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
    });
    expect(created.status()).toBe(201);
    const productId = (await created.json()).data.id as string;

    try {
        await page.goto(`/products/${productId}`, { waitUntil: 'domcontentloaded' });

        const video = page.getByTestId('product-video');
        await expect(video).toBeVisible({ timeout: 20_000 });
        await expect(video.locator('iframe[src*="youtube"]')).toBeVisible({ timeout: 20_000 });
    } finally {
        await request.delete(`/api/products/${productId}`, {
            headers: bearer(adminToken),
        });
    }
});
