import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

// Admin RBAC console: stat cards, role grid, manage sheet, create/delete
// custom roles. Desktop-only like the rest of the admin console.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'admin console is desktop-only');
});

const SUPER = { email: 'super@everythingneed.com', passwords: ['password', 'Password1'] };

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

function roleCard(page: import('@playwright/test').Page, label: string) {
    return page.locator(
        `xpath=//h3[normalize-space()="${label}"]/ancestor::div[contains(@class, "h-full")][1]`,
    );
}

test('super admin sees stats, badges, grant box and role grid', async ({ page }) => {
    await webLogin(page, SUPER, '/admin/dashboard');
    await page.goto('/admin/rbac', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Roles & Permissions' })).toBeVisible();

    // Stat strip.
    await expect(page.getByText('Total roles')).toBeVisible();
    await expect(page.getByText('Permissions', { exact: true })).toBeVisible();
    await expect(page.getByText('Core roles')).toBeVisible();
    await expect(page.getByText('Role assignments')).toBeVisible();

    // Quick grant box (single role + permission pair).
    await expect(page.getByLabel('Role')).toBeVisible();
    await expect(page.getByLabel('Permission')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Grant', exact: true })).toBeVisible();

    // Super Admin card carries the Core badge; Moderator is built-in.
    const superCard = roleCard(page, 'Super Admin');
    await expect(superCard).toBeVisible();
    await expect(superCard.getByText('Core', { exact: true })).toBeVisible();

    // Role filter narrows the grid to one card.
    await page.getByPlaceholder('Filter roles...').fill('Moderator');
    await expect(roleCard(page, 'Moderator')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Super Admin', exact: true })).toHaveCount(0);
    await page.getByPlaceholder('Filter roles...').fill('');
    await expect(superCard).toBeVisible();
});

test('manage sheet saves a bulk permission change that applies immediately', async ({
    page,
    request,
}) => {
    await webLogin(page, SUPER, '/admin/dashboard');
    const token = await apiLogin(request, SUPER);
    const permission = 'analytics.overview.export';

    await page.goto('/admin/rbac', { waitUntil: 'domcontentloaded' });

    const card = roleCard(page, 'Moderator');
    await card.getByRole('button', { name: 'Manage' }).click();

    const sheet = page.getByRole('dialog', { name: 'Manage Moderator' });
    await expect(sheet).toBeVisible();

    await sheet.getByPlaceholder('Search permissions...').fill(permission);
    const box = sheet.getByRole('checkbox', { name: new RegExp(permission.replace(/\./g, '\\.')) });
    await expect(box).toBeVisible();
    await box.check();

    await sheet.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Updated Moderator')).toBeVisible({ timeout: 30_000 });
    await expect(sheet).toBeHidden();

    // Server truth: the grant stuck.
    const matrix = await (
        await request.get('/api/admin/rbac/matrix', { headers: bearer(token) })
    ).json();
    const moderator = (matrix.data as Array<{ role: string; permissions: string[] }>).find(
        (row) => row.role === 'moderator',
    );
    expect(moderator?.permissions).toContain(permission);

    // Reopen: the sheet seeds from the fresh matrix with the box checked.
    await card.getByRole('button', { name: 'Manage' }).click();
    await sheet.getByPlaceholder('Search permissions...').fill(permission);
    await expect(box).toBeChecked();
    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(sheet).toBeHidden();

    // Restore the reversible denied state for other suites (W2 semantics).
    const revoke = await request.post('/api/admin/rbac/revoke', {
        headers: bearer(token),
        data: { role: 'moderator', permission },
    });
    expect(revoke.ok()).toBeTruthy();
});

test('super admin creates a custom role from the header and deletes it', async ({
    page,
    request,
}) => {
    await webLogin(page, SUPER, '/admin/dashboard');
    const token = await apiLogin(request, SUPER);

    const stamp = Date.now();
    const name = `E2E Ops ${stamp}`;
    const slug = `e2e_ops_${stamp}`;

    await page.goto('/admin/rbac', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Create role' }).click();

    const sheet = page.getByRole('dialog', { name: 'Create role' });
    await expect(sheet).toBeVisible();

    await sheet.getByLabel('Role name').fill(name);
    // Slug is derived live from the name until manually edited.
    await expect(sheet.getByLabel('Slug')).toHaveValue(slug);

    await sheet.getByPlaceholder('Search permissions...').fill('products.products.view');
    await sheet
        .getByRole('checkbox', { name: /products\.products\.view/ })
        .check();

    await sheet.getByRole('button', { name: 'Create role' }).click();
    await expect(page.getByText(`Role ${name} created`)).toBeVisible({ timeout: 30_000 });
    await expect(sheet).toBeHidden();

    // The new card renders with the Custom badge and the picked permission.
    await page.getByPlaceholder('Filter roles...').fill(name);
    const card = roleCard(page, name);
    await expect(card).toBeVisible();
    await expect(card.getByText('Custom', { exact: true })).toBeVisible();
    await expect(card.getByText('products.products.view')).toBeVisible();

    // Delete (no holders yet): shared confirm dialog, then the card is gone.
    await card.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete role' }).click();
    await expect(page.getByText(`${name} deleted`)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0);

    // Server truth: the role registry no longer lists the slug.
    const roles = await (
        await request.get('/api/admin/roles', { headers: bearer(token) })
    ).json();
    expect(
        (roles.data as Array<{ role: string }>).some((row) => row.role === slug),
    ).toBeFalsy();
});

test('the console stays usable across 375 / 834 / 1280 viewports', async ({ page }) => {
    await webLogin(page, SUPER, '/admin/dashboard');

    for (const [width, height] of [
        [375, 812],
        [834, 1112],
        [1280, 900],
    ] as const) {
        await page.setViewportSize({ width, height });
        await page.goto('/admin/rbac', { waitUntil: 'domcontentloaded' });

        await expect(page.getByRole('heading', { name: 'Roles & Permissions' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create role' })).toBeVisible();
        await expect(page.getByText('Total roles')).toBeVisible();
        await expect(page.getByLabel('Role')).toBeVisible();
    }
});
