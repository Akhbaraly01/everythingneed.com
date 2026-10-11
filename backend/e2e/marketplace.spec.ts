import { test, expect } from '@playwright/test';

/**
 * Wave S (§96) — public marketplace journeys on desktop AND mobile:
 * every major route loads with real data, forms validate, empty states
 * render, and failure states never strand the visitor.
 */

test('guest loads home with real sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-section-categories')).toBeVisible();
    await expect(page.getByTestId('home-section-experts')).toBeVisible();
});

test('guest browses products and gets an empty search state', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder('Search products...')).toBeVisible();
    // Seeded catalogue renders real rows with cart actions.
    await expect(page.getByTitle('Add to cart').first()).toBeVisible();

    await page.goto('/search?q=zzzznomatchxyz', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('No results found')).toBeVisible();
});

test('guest opens the vertical listings', async ({ page }) => {
    const targets = [
        { path: '/food', heading: 'Restaurants' },
        { path: '/hotels', heading: 'Hotels' },
    ] as const;
    for (const target of targets) {
        await page.goto(target.path, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: target.heading }).first()).toBeVisible();
    }

    await page.goto('/learn', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Learn New Skills/ })).toBeVisible();
});

test('register surfaces the taken-email failure without creating anything', async ({
    page,
}) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.locator('#name').fill('E2E Probe');
    await page.locator('#email').fill('user@everythingneed.com');
    await page.locator('#password').fill('Password1!');
    await page.locator('#password_confirmation').fill('Password1!');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form p.text-red-600').first()).toBeVisible();
    // Failure state: still on the form, never logged in.
    await expect(page).toHaveURL(/register/);
    await expect(page.locator('#name')).toHaveValue('E2E Probe');
});

test('login requires credentials before redirecting', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form p.text-destructive').first()).toBeVisible();
    await expect(page).toHaveURL(/login/);
});
