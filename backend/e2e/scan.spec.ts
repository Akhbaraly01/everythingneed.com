import { test, expect } from '@playwright/test';

/**
 * Master-plan phase 20 - scan workflow is a real page, never a dead button:
 * the search bar's picture-search sheet opens /scan on every viewport,
 * manual code lookup validates, resolves matches, and renders the empty
 * state.
 */

test('the picture-search sheet opens the scan page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // The standalone header button is gone: scanning now lives in the
    // search bar (camera / upload / code).
    await page.getByRole('button', { name: 'Search by image' }).click();
    await page.getByRole('button', { name: /Scan a product code/ }).click();
    // Late in a full-suite run the single-worker dev server answers
    // slowly; allow extra time for this cross-page navigation.
    await expect(page).toHaveURL(/\/scan/, { timeout: 45_000 });
    await expect(page.getByRole('heading', { name: /Scan a product code/ })).toBeVisible();
});

test('manual code lookup validates and renders the empty state', async ({ page }) => {
    await page.goto('/scan', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Manual entry/ }).click();

    await page.getByLabel('Product code').fill('x');
    await page.getByRole('button', { name: 'Find' }).click();
    await expect(page.getByText('Enter at least 2 characters')).toBeVisible();

    await page.getByLabel('Product code').fill('zzzqxj91nomatch');
    await page.getByRole('button', { name: 'Find' }).click();
    await expect(page.getByText('No products matched that code')).toBeVisible();
});
