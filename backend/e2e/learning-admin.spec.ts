import { expect, test } from '@playwright/test';
import { webLogin } from './helpers/auth';

/**
 * Phase L-B: the Learning console is a real lifecycle - create (live by
 * default, spec 47), unpublish to draft, edit objectives/requirements in
 * place, publish again, and delete through the confirm dialog (never a
 * native confirm()). The row it created is removed at the end, so the dev
 * database keeps no smoke data behind.
 */

const SUPER = { email: 'super@everythingneed.com', password: 'password' };

// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'admin console is desktop-only');
});

test('learning console: create, unpublish, edit, publish, delete', async ({ page }) => {
    const title = `Lb3 smoke ${Date.now()}`;
    await webLogin(page, SUPER, '/admin/learning/courses');
    await page.goto('/admin/learning/courses', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Learning Management' })).toBeVisible();

    await page.getByRole('button', { name: 'Add course' }).click();
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Category').fill('smoke-testing');
    await page.getByLabel('Instructor').fill('Smoke Tester');
    await page.getByLabel('Price').fill('0');
    await page.getByLabel('Description').fill('Smoke description for the L-B lifecycle.');
    await page.getByLabel(/Learning objectives/).fill('Learn one\nLearn two');
    await page.getByLabel('Requirements').fill('Nothing at all.');
    await page.getByRole('button', { name: 'Create course' }).click();
    await expect(page.getByText('Course created')).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toBeVisible();
    await expect(row.getByText('published', { exact: true })).toBeVisible();

    await row.getByTitle('Unpublish').click();
    await expect(page.getByText('Course unpublished')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: title }).getByText('draft', { exact: true })).toBeVisible();

    await page.getByRole('row').filter({ hasText: title }).getByTitle('Edit').click();
    await page.getByLabel('Description').fill('Edited smoke description.');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Course updated')).toBeVisible();

    await page.getByRole('row').filter({ hasText: title }).getByTitle('Publish').click();
    await expect(page.getByText('Course published')).toBeVisible();

    await page.getByRole('row').filter({ hasText: title }).getByTitle('Delete').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Course deleted')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0);
});
