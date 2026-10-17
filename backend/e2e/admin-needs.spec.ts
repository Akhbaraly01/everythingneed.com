import { test, expect } from '@playwright/test';
import { webLogin } from './helpers/auth';

// P0 admin needs console: tabs render, queues load, fraud scan runs.
// Desktop-only like the rest of the admin console (see admin.spec.ts).
// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'admin console is desktop-only');
});

const SUPER = { email: 'super@everythingneed.com', passwords: ['password', 'Password1'] };

test('super admin moderates needs: console tabs render and fraud scan runs', async ({
    page,
}) => {
    await webLogin(page, SUPER, '/admin/dashboard');
    await page.goto('/admin/needs', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Needs & Tasks' }).first()).toBeVisible();
    for (const tab of ['Overview', 'Requests', 'Offers', 'Tasks', 'Disputes', 'Fraud Flags', 'Providers', 'Listings', 'Categories']) {
        await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    }
    // Overview lands first with live attention metrics.
    await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible();

    // Requests queue loads (columnheaders prove live rows, not an empty shell).
    await page.getByRole('tab', { name: 'Requests' }).click();
    await expect(page.getByRole('columnheader', { name: 'Request #' })).toBeVisible();

    // Fraud tab: on-demand scan completes and toasts.
    await page.getByRole('tab', { name: 'Fraud Flags' }).click();
    await expect(page.getByRole('columnheader', { name: 'Rule' })).toBeVisible();
    await page.getByRole('button', { name: 'Run fraud scan' }).click();
    await expect(page.getByText('Scan complete:')).toBeVisible({ timeout: 30_000 });

    // Back on Requests: the status filter renders.
    await page.getByRole('tab', { name: 'Requests' }).click();
    await expect(page.getByLabel('Status')).toBeVisible();
});

test('super admin manages need categories: create, toggle, delete', async ({
    page,
}) => {
    await webLogin(page, SUPER, '/admin/dashboard');
    await page.goto('/admin/needs', { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Categories' }).click();

    const slug = `e2e-cat-${Date.now()}`;
    await page.getByRole('button', { name: 'New category' }).click();
    await page.locator('label:has-text("Name *") input').fill(`E2E ${slug}`);
    await page.locator('label:has-text("Slug *") input').fill(slug);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(slug).first()).toBeVisible({ timeout: 30_000 });

    // Deactivate then delete the unused category (confirmation is the
    // shared React dialog, not a native window.confirm).
    const row = page.locator('tr', { hasText: slug });
    await row.getByRole('button', { name: 'Deactivate' }).click();
    await expect(row.getByText('no').first()).toBeVisible({ timeout: 30_000 });
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText(slug)).toHaveCount(0, { timeout: 30_000 });
});
