import { test, expect } from '@playwright/test';
import { webLogin } from './helpers/auth';

const SUPER = { email: 'super@everythingneed.com', password: 'password' };

// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'admin console is desktop-only');
});

test('dashboard stats lead the page and admin access controls are live', async ({ page }) => {
    await webLogin(page, SUPER, '/admin/dashboard');

    const totalUsers = page.getByText('Total Users', { exact: true });
    await expect(totalUsers).toHaveCount(1);

    const statsBox = await totalUsers.boundingBox();
    const accessBox = await page.getByRole('heading', { name: 'Admin Access' }).boundingBox();
    expect(statsBox && accessBox && statsBox.y < accessBox.y).toBeTruthy();

    const switches = page.getByRole('switch');
    expect(await switches.count()).toBeGreaterThanOrEqual(30);
    expect(
        await switches.evaluateAll((nodes) => nodes.some((node) => (node as HTMLButtonElement).disabled)),
    ).toBe(true);

    await page.locator('main a[href="/admin/users"]').first().click();
    await expect(page).toHaveURL(/\/admin\/users$/);
});

test('every admin sidebar link navigates to its page', async ({ page }) => {
    // 50 console pages in a row: the single-threaded dev server needs
    // ~5s per page, so the budget is sized for the whole tour.
    test.setTimeout(600_000);
    await webLogin(page, SUPER, '/admin/dashboard');

    // The console renders client-side; wait for the sidebar before
    // counting (a slow dev server must not look like a missing nav).
    await expect(page.locator('nav a[href^="/admin"]').first()).toBeVisible();

    const hrefs = await page
        .locator('nav a[href^="/admin"]')
        .evaluateAll((links) =>
            Array.from(new Set(links.map((link) => link.getAttribute('href') ?? ''))).filter(Boolean),
        );

    expect(hrefs.length, 'super admin sees the full sidebar').toBeGreaterThanOrEqual(45);
    expect(hrefs).toContain('/admin/agriculture');
    expect(hrefs).toContain('/admin/deals');
    expect(hrefs).toContain('/admin/messaging');

    for (const href of hrefs) {
        // Inertia swaps the sidebar while the previous page settles; a
        // detached link swallows the click, so retry the whole step.
        await expect(async () => {
            await page.locator(`nav a[href="${href}"]`).first().click();
            await expect(page).toHaveURL(
                new RegExp(`${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
                { timeout: 20_000 },
            );
        }).toPass({ timeout: 90_000 });

        await expect(page.locator('main')).toBeVisible();
        await expect(page.getByText('Access denied')).toHaveCount(0);
        await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
    }
});
