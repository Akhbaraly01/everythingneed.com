import { test, expect } from '@playwright/test';
import { webLogin, apiLogin } from './helpers/auth';

const CUSTOMER = { email: 'user@everythingneed.com', password: 'Password1' };
const SUPER = { email: 'super@everythingneed.com', password: 'password' };
test('customer saves a job and finds it on the wishlist', async ({ page, request }) => {
    // Self-contained: a fresh job per run, owned by someone else so the
    // customer sees Apply + Save (owners get "Your listing" instead).
    const adminToken = await apiLogin(request, SUPER);
    const title = `E2E Saved Job ${Date.now()}`;
    const created = await request.post('/api/jobs', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
            title,
            description: 'Deterministic fixture for the save flow.',
            company: 'E2E Co',
            location: 'Accra',
            job_type: 'full_time',
        },
    });
    expect(created.status(), 'job created').toBe(201);
    const job = (await created.json()).data as { id: string };

    await webLogin(page, CUSTOMER);
    await page.goto(`/jobs/${job.id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();

    await page.getByRole('button', { name: /save job/i }).click();
    await expect(page.getByRole('button', { name: /^saved$/i })).toBeVisible();

    await page.goto('/wishlist', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(title).first()).toBeVisible();
});

test('customer reviews an expert and sees it listed', async ({ page, request }) => {
    const experts = await (await request.get('/api/experts')).json();
    const expert = (experts.data as Array<{ id: string; name: string }>)[0];
    expect(expert, 'seeded experts exist').toBeTruthy();

    await webLogin(page, CUSTOMER);
    await page.goto(`/experts/${expert.id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('expert-reviews')).toBeVisible();

    await page.getByRole('button', { name: 'Rate 5 out of 5' }).click();
    const comment = `E2E review thorough session ${Date.now()}`;
    await page.getByPlaceholder('Share your experience (optional)...').fill(comment);
    await page.getByRole('button', { name: 'Submit review' }).click();
    await expect(page.getByText(comment).first()).toBeVisible();
});

test('super admin moderates expert reviews from the console', async ({ page, request }) => {
    // Seed one review through the API so the console has a row to show.
    const experts = await (await request.get('/api/experts')).json();
    const expert = (experts.data as Array<{ id: string }>)[0];
    const token = await apiLogin(request, CUSTOMER);
    await request.post(`/api/experts/${expert.id}/review`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { rating: 4, comment: 'E2E moderation probe review' },
    });

    await webLogin(page, SUPER, '/admin/dashboard');
    await page.goto('/admin/reviews', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'expert', exact: true }).click();
    // DataTable keeps the md+ table and the mobile card list in the DOM at
    // once (one is CSS-hidden per viewport) - target the visible copy.
    await expect(
        page.getByText('E2E moderation probe review').filter({ visible: true }).first(),
    ).toBeVisible();
});
