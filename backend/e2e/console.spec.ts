import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

/**
 * Wave S (§96) — admin console journeys (desktop-only project): Wave P/Q/R
 * pages load with real data, the create forms validate, failure states
 * surface, and success states land rows that the API can see.
 *
 * Sign-ins reuse the shared cached-session helpers (login is throttled to
 * ten attempts per minute across the whole suite).
 */

const SUPER = { email: 'super@everythingneed.com', password: 'password' };
const CONTENT = { email: 'content@everythingneed.com', password: 'Password1' };

// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'admin console is desktop-only');
});

test('super admin creates a category through the Wave P form (failure first)', async ({
    page,
    request,
}) => {
    await webLogin(page, SUPER, '/admin/dashboard');
    await page.waitForURL('**/admin/dashboard**');

    await page.goto('/admin/categories');
    await expect(page.getByRole('heading', { name: 'Categories' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Add category' }).click();

    const name = `E2E Category ${Date.now()}`;
    // Failure state first: the required name blocks an empty submit
    // natively (no request leaves the browser, no row is created).
    await page.locator('#cat-name').fill('');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.locator('#cat-name')).toBeVisible();

    // Success state: the row lands with its SEO title.
    await page.locator('#cat-name').fill(name);
    await page.locator('#cat-meta-title').fill(`${name} meta`);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText(name)).toBeVisible();

    // Cleanup through the API so the live catalogue stays pristine.
    const token = await apiLogin(request, SUPER);
    const list = await (
        await request.get(`/api/categories?search=${encodeURIComponent(name)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
    ).json();
    const id = (list.data ?? []).find(
        (c: { name: string }) => c.name === name
    )?.id as string | undefined;
    expect(id, 'created category visible to the API').toBeTruthy();
    const del = await request.delete(`/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(del.ok(), `cleanup delete -> ${del.status()}`).toBeTruthy();
});

test('content manager hits the executable-content guard in the CMS', async ({
    page,
    request,
}) => {
    await webLogin(page, CONTENT, '/admin/cms');
    await page.waitForURL('**/admin/cms**');
    await expect(page.getByRole('heading', { name: 'Content Manager' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'New page' }).click();
    const title = `E2E Probe Page ${Date.now()}`;
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByPlaceholder('Content').fill('<script>alert(1)</script>');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    // Wave Q failure state: server-side executable-code rejection.
    await expect(page.locator('p.text-red-600').first()).toBeVisible();

    await page.getByPlaceholder('Content').fill('Plain marketing copy.');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible();

    const token = await apiLogin(request, SUPER);
    const list = await (
        await request.get('/api/admin/cms/pages', {
            headers: { Authorization: `Bearer ${token}` },
        })
    ).json();
    const id = (list.data ?? []).find((p: { title: string }) => p.title === title)?.id as
        | string
        | undefined;
    expect(id, 'created page visible to the API').toBeTruthy();
    const del = await request.delete(`/api/admin/cms/pages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(del.ok(), `cleanup delete -> ${del.status()}`).toBeTruthy();
});

test('super admin tours the Wave P consoles and the analytics funnel', async ({ page }) => {
    await webLogin(page, SUPER, '/admin/dashboard');
    await page.waitForURL('**/admin/dashboard**');

    const targets = [
        { path: '/admin/vendors', heading: 'Manage Vendors' },
        { path: '/admin/cms', heading: 'Content Manager' },
        { path: '/admin/learning/courses', heading: 'Learning Management' },
        { path: '/admin/food', heading: 'Restaurant Management' },
        { path: '/admin/hotels', heading: 'Hotel Management' },
        { path: '/admin/real-estate', heading: 'Real Estate Listings' },
    ] as const;
    for (const target of targets) {
        await page.goto(target.path);
        await expect(page.getByRole('heading', { name: target.heading }).first()).toBeVisible();
        await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
    }

    await page.goto('/admin/analytics');
    await expect(page.getByRole('heading', { name: 'Platform Analytics' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Conversion funnel/ })).toBeVisible();
});
