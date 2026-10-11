import { test, expect } from '@playwright/test';
import { webLogin } from './helpers/auth';

const CUSTOMER = { email: 'user@everythingneed.com', password: 'Password1' };

test('guest hitting a protected customer page lands on login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login**');
    await expect(page.locator('#login-email')).toBeVisible();
});

test('customer logs in and renders dashboard, orders and wallet', async ({ page }) => {
    await webLogin(page, CUSTOMER);
    await page.waitForURL('**/dashboard**');
    await expect(page.locator('#login-email')).toHaveCount(0);

    for (const path of ['/orders', '/wallet', '/cart']) {
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(path.replace('/', '/') + '$'));
        await expect(page.locator('#login-email')).toHaveCount(0);
    }
});

test('wrong password surfaces the credential error on the login form', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill(CUSTOMER.email);
    await page.locator('#login-password').fill('definitely-not-the-password');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText(/these credentials do not match/i).first()).toBeVisible();
});
