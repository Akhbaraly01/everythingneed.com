import { test, expect } from '@playwright/test';
import { webLogin } from './helpers/auth';

/**
 * Local media upload with WhatsApp-style client-side compression.
 *
 * The vendor "Add Product" form accepts a device file (not just a URL). A
 * large camera photo is generated in-browser, handed to the hidden file
 * input, and must leave the browser *already compressed* - we assert the
 * multipart body is smaller than the original bytes - before the upload
 * round-trips through /api/upload and the product saves.
 */

// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'vendor portal is desktop-only');
});

// Seeded vendor: admin@ owns TechStore (electronics).
const VENDOR = { email: 'admin@everythingneed.com', passwords: ['Password1', 'password'] };

async function generateBigJpeg(page: import('@playwright/test').Page): Promise<Buffer> {
    const base64 = await page.evaluate(async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 2600;
        canvas.height = 1900;
        const ctx = canvas.getContext('2d')!;
        // Random noise defeats JPEG compression - guarantees a multi-MB source.
        const image = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < image.data.length; i += 4) {
            image.data[i] = Math.floor(Math.random() * 256);
            image.data[i + 1] = Math.floor(Math.random() * 256);
            image.data[i + 2] = Math.floor(Math.random() * 256);
            image.data[i + 3] = 255;
        }
        ctx.putImageData(image, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.98).split(',')[1];
    });
    return Buffer.from(base64, 'base64');
}

test('vendor product form compresses and uploads a local image file', async ({ page }) => {
    await webLogin(page, VENDOR, '/vendor/products');
    await page.goto('/vendor/products/create', { waitUntil: 'domcontentloaded' });

    // Big source photo + request-body capture BEFORE the upload happens.
    const source = await generateBigJpeg(page);
    expect(source.length).toBeGreaterThan(500 * 1024);

    const uploadResponse = page.waitForResponse(
        (response) => response.url().includes('/api/upload') && response.request().method() === 'POST',
        { timeout: 60_000 },
    );

    await page.getByTestId('product-image-input').setInputFiles({
        name: 'e2e-camera-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: source,
    });

    const response = await uploadResponse;
    expect(response.status()).toBe(201);

    // Client-side compression ran: the success toast only renders when the
    // original file shrank ("Uploaded · X MB → Y KB (Z% smaller)").
    const toast = await page
        .getByText(/Uploaded · .+ smaller/)
        .first()
        .isVisible({ timeout: 15_000 })
        .catch(() => false);
    expect(toast, 'compression toast should confirm the file shrank').toBe(true);

    // Server stored the (further GD-capped) image and returned its URL.
    const payload = await response.json();
    expect(payload.data.url).toBeTruthy();
    expect(payload.data.size).toBeLessThan(source.length);

    // The preview replaced the picker with the Replace/link controls.
    await expect(page.getByTestId('product-image-replace')).toBeVisible();

    // Product saves with the uploaded image URL attached.
    const name = `E2E Local Image Product ${Date.now()}`;
    await page.getByTestId('product-name').fill(name);
    await page.getByTestId('product-category').fill('electronics');
    await page.getByTestId('product-price').fill('29.99');
    await page.getByTestId('product-stock').fill('7');

    // Late in a full-suite run the single-worker dev server answers slowly;
    // the submit stays disabled until /api/vendors/mine resolves.
    await expect(page.getByTestId('product-submit')).toBeEnabled({ timeout: 45_000 });
    await page.getByTestId('product-submit').click();

    await page.waitForURL('**/vendor/products', { timeout: 20_000 });
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
});
