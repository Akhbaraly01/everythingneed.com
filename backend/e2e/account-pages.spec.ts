import { test, expect } from '@playwright/test';

/**
 * Plan loop: new pages are guarded and reachable.
 * - Suspended/appeal page renders for guests.
 * - Auth-only pages bounce guests to /login.
 * - 2FA challenge without a pending session bounces to /login.
 */

test('guest can open the suspended appeal page', async ({ page }) => {
    await page.goto('/suspended', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/has been suspended/)).toBeVisible();
    await expect(page.getByLabel('Account email')).toBeVisible();
    await expect(page.getByLabel('Your appeal')).toBeVisible();
});

test('auth-only pages redirect guests to login', async ({ page }) => {
    for (const path of ['/account/sessions', '/account/privacy', '/admin/navigation', '/2fa/challenge']) {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/login/);
    }
});
