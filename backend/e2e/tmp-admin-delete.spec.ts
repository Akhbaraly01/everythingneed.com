import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

const SUPER = { email: 'super@everythingneed.com', password: 'password' };

test('admin user delete button removes the account', async ({ page }) => {
    test.setTimeout(300_000);
    await webLogin(page, SUPER, '/admin/users');

    const stamp = Date.now();
    const email = `delete-probe-${stamp}@example.com`;
    const token = await apiLogin(page.request, SUPER);
    const created = await page.request.post('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
            name: `Delete Probe ${stamp}`,
            email,
            password: 'Password1',
            role: 'user',
        },
    });
    expect(created.ok(), await created.text()).toBeTruthy();
    const body = await created.json();
    const id = body.data?.id ?? body.user?.id ?? body.id;

    await page.goto('/admin/users');
    await page.getByPlaceholder('Search by name or email...').fill(email);
    const row = page.getByText(email, { exact: true });
    await expect(row.first()).toBeVisible({ timeout: 20_000 });

    if (id) {
        await page.locator(`[data-testid="user-delete-${id}"]:visible`).click();
    } else {
        await page.getByTitle('Delete user').first().click();
    }

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('deleted.', { exact: false })).toBeVisible({ timeout: 20_000 });
    await expect(row).toHaveCount(0);

    const listed = await page.request.get(`/api/admin/users?search=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(listed.ok()).toBeTruthy();
    const payload = await listed.json();
    const users = payload.data ?? [];
    expect(users.some((u: { email?: string }) => u.email === email)).toBe(false);
});
