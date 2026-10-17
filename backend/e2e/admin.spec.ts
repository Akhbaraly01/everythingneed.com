import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

// Wave S: the admin console is desktop-only (dense tables); mobile covers
// the public marketplace journeys in marketplace.spec.ts.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'admin console is desktop-only');
});

const SUPER = { email: 'super@everythingneed.com', passwords: ['password', 'Password1'] };
const CUSTOMER = { email: 'user@everythingneed.com', passwords: ['Password1', 'password'] };
// Seeded vendors: admin@ owns TechStore (electronics), cs@ owns FashionHub
// (clothing, factory password 'password' - cs@ is outside TestUsersSeeder),
// vendor@ owns the placeholder store. The purchased product's vendor decides
// which one can fulfil - try all three (matrix-style password fallbacks).
const FULFILMENT_LOGINS = [
    { email: 'admin@everythingneed.com', passwords: ['Password1', 'password'] },
    { email: 'cs@everythingneed.com', passwords: ['password', 'Password1'] },
    { email: 'vendor@everythingneed.com', passwords: ['Password1', 'password'] },
];

const RETURN_REASON = 'Playwright E2E: item arrived damaged';

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

test('guest hitting the admin console lands on login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/login**');
    await expect(page.locator('#login-email')).toBeVisible();
});

test('super admin reorders and toggles home sections', async ({ page }) => {
    await webLogin(page, SUPER, '/admin/dashboard');
    await page.goto('/admin/home-sections', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-admin-section-featured')).toBeVisible();
    await expect(page.getByTestId('home-admin-section-deals')).toBeVisible();

    // Toggle off then back on (persists through the API).
    const toggle = page.getByTestId('home-admin-toggle-deals');
    const wasOn = (await toggle.getAttribute('aria-checked')) === 'true';
    await toggle.click();
    await expect(toggle).toHaveAttribute(
        'aria-checked',
        wasOn ? 'false' : 'true',
        { timeout: 10_000 },
    );
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', wasOn ? 'true' : 'false', {
        timeout: 10_000,
    });
});

test('super admin manages course lessons from the Learning console', async ({ page }) => {
    await webLogin(page, SUPER, '/admin/dashboard');
    await page.goto('/admin/learning/courses', { waitUntil: 'domcontentloaded' });

    // Open the lesson manager on the first course row (real API rows).
    const manage = page.getByTestId('manage-lessons').first();
    await expect(manage).toBeVisible({ timeout: 20_000 });
    await manage.click();
    await expect(page.getByTestId('lesson-manager')).toBeVisible();

    // Add a lesson with a YouTube URL - the learner page plays it in-app.
    const title = `E2E lesson ${Date.now()}`;
    await page.getByTestId('lesson-title').fill(title);
    await page.getByTestId('lesson-video-link-toggle').click();
    await page.getByTestId('lesson-video-url').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.getByRole('button', { name: 'Use link' }).click();
    await page.getByTestId('lesson-save').click();

    const list = page.getByTestId('lesson-list');
    await expect(list.getByText(title)).toBeVisible({ timeout: 15_000 });

    // Remove it again: row trash -> confirm dialog -> gone.
    await list.getByText(title).locator('xpath=ancestor::li').getByTitle('Delete lesson').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(list.getByText(title)).toHaveCount(0, { timeout: 15_000 });
});

test('customer files a return and the super admin sees it in the Returns tab', async ({
    page,
    request,
}) => {
    // ---- Customer API chain: cart -> checkout -> pay -> return ----
    const customerToken = await apiLogin(request, CUSTOMER);

    // Idempotent setup: leftover cart items from previous runs would push
    // (existing + 1) past the stock check and 422 the add.
    await request.delete('/api/cart', { headers: bearer(customerToken) });

    const products = await (
        await request.get('/api/products', { headers: bearer(customerToken) })
    ).json();
    // Wave S: never assume row zero is buyable (e2e runs deplete stock).
    const product = (products.data as Array<{ id: string; stock_quantity?: number }>).find(
        (p) => Number(p.stock_quantity ?? 0) >= 1
    );
    expect(product, 'seeded catalogue has a buyable product').toBeTruthy();
    const productId = product!.id as string;

    const addRes = await request.post('/api/cart/items', {
        headers: bearer(customerToken),
        data: { product_id: productId, quantity: 1 },
    });
    expect(addRes.status(), 'cart add').toBe(200);

    const orderRes = await request.post('/api/product-orders', {
        headers: bearer(customerToken),
        data: {
            items: [{ product_id: productId, quantity: 1 }],
            shipping_address: 'Playwright Street',
            shipping_city: 'Accra',
        },
    });
    expect(orderRes.status(), 'checkout').toBe(201);
    const orderBody = await orderRes.json();
    const orderId = orderBody.data.id as string;
    const total = Number(orderBody.data.total_amount);

    const chargeRes = await request.post('/api/payments/charge', {
        headers: bearer(customerToken),
        data: { order_id: orderId, amount: total, method: 'card' },
    });
    expect(chargeRes.status(), 'payment charge').toBe(201);

    // ---- Vendor fulfilment: accept -> ship -> deliver ----
    let fulfilled = false;
    for (const creds of FULFILMENT_LOGINS) {
        const token = await apiLogin(request, creds);
        const list = await (
            await request.get('/api/vendor/orders', { headers: bearer(token) })
        ).json();
        const row = (list.data ?? []).find(
            (r: { id: string; order_id?: string }) => r.order_id === orderId
        );
        if (!row) continue;
        for (const action of ['accept', 'ship', 'deliver']) {
            const res = await request.post(`/api/vendor/orders/${row.id}/${action}`, {
                headers: bearer(token),
            });
            expect(res.ok(), `vendor ${action} -> ${res.status()}`).toBeTruthy();
        }
        fulfilled = true;
        break;
    }
    expect(fulfilled, 'no fulfilment vendor matched the purchased product').toBeTruthy();

    const returnRes = await request.post('/api/returns', {
        headers: bearer(customerToken),
        data: { order_id: orderId, reason: RETURN_REASON },
    });
    expect(returnRes.status(), 'file return').toBe(201);

    // ---- Browser: super admin reviews it ----
    await webLogin(page, SUPER, '/admin/dashboard');
    await expect(page.locator('#login-email')).toHaveCount(0);

    await page.goto('/admin/returns');
    // AdminLayout title + page h1 both render the text - first() avoids the strict violation.
    await expect(
        page.getByRole('heading', { name: 'Returns & Disputes' }).first()
    ).toBeVisible();

    await page.getByRole('button', { name: 'Returns', exact: true }).click();
    await expect(page.getByRole('columnheader', { name: 'Reason' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Refund' })).toBeVisible();
    // Repeated runs accumulate pending returns with the same reason text.
    await expect(page.getByText(RETURN_REASON).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'refunded', exact: true })).toBeVisible();

    // Gap 3: filing the return also raised a pending refund REQUEST — it sits
    // in the support review queue (Refunds tab) until approved or rejected.
    await page.getByRole('button', { name: 'Refunds', exact: true }).click();
    await expect(page.getByRole('columnheader', { name: 'Requested by' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
    // The pending filter chip proves the queue carries live requests.
    await expect(page.getByRole('button', { name: 'pending', exact: true })).toBeVisible();
});

test('super admin opens the reports, analytics, system and audit console pages', async ({
    page,
}) => {
    await webLogin(page, SUPER, '/admin/dashboard');

    const targets: { path: string; heading: string }[] = [
        { path: '/admin/reports', heading: 'Reports' },
        { path: '/admin/analytics', heading: 'Platform Analytics' },
        { path: '/admin/system', heading: 'System Health' },
        { path: '/admin/audit-logs', heading: 'Audit Logs' },
    ];
    for (const target of targets) {
        await page.goto(target.path);
        // AdminLayout title + page h1 can both render - first() avoids strict violations.
        const heading = page.getByRole('heading', { name: target.heading }).first();
        // Analytics cold-cache fetch can exceed the default 20s on first hit.
        if (target.heading === 'Platform Analytics') {
            await page.waitForLoadState('networkidle');
            await expect(heading).toBeVisible({ timeout: 45_000 });
        } else {
            await expect(heading).toBeVisible();
        }
        // Web errors redirect back with this flash message - must never fire here.
        await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
    }
});
