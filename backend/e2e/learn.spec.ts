import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

/**
 * Phase L-A (Learn 2.0 knowledge feed) â€” end-to-end: a learner submits a
 * post, a reviewer approves it, it becomes publicly readable, the watch
 * page plays it and takes a real comment, and the reviewer console lists
 * the queue. Every step runs against the real API/database; titles are
 * unique per run so the spec stays idempotent.
 *
 * Sign-ins reuse the shared cached-session helpers: every real login costs
 * a `throttle:10,1` slot on both the API and web login routes.
 */

const CUSTOMER = { email: 'user@everythingneed.com', passwords: ['Password1', 'password'] };
const SUPER = { email: 'super@everythingneed.com', passwords: ['password', 'Password1'] };

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

interface FeedPost {
    id: string;
    title: string;
    status: string;
}

test('knowledge feed: submit -> approve -> watch page -> comment', async ({ page, request }) => {
    const learnerToken = await apiLogin(request, CUSTOMER);
    const title = `E2E Knowledge ${Date.now()}`;

    // 1. A learner submits; it is pending, so it is NOT public yet.
    const created = await request.post('/api/learn/posts', {
        headers: bearer(learnerToken),
        data: {
            title,
            content: 'Playwright checks the Learn 2.0 review lifecycle end to end.',
            category: 'agriculture',
            media_type: 'text',
        },
    });
    expect(created.status(), 'post submitted').toBe(201);
    const post = (await created.json()).data as FeedPost;
    expect(post.status).toBe('pending');

    const search = async (): Promise<FeedPost[]> => {
        const res = await request.get(`/api/learn/posts?q=${encodeURIComponent(title)}`);
        expect(res.ok()).toBeTruthy();
        return ((await res.json()).data ?? []) as FeedPost[];
    };
    expect(
        (await search()).find((p) => p.id === post.id),
        'pending post is invisible in the public feed',
    ).toBeUndefined();

    // 2. A different account (super admin) approves it.
    const reviewerToken = await apiLogin(request, SUPER);
    const approve = await request.post(`/api/learn/posts/${post.id}/approve`, {
        headers: bearer(reviewerToken),
    });
    expect(approve.ok(), `approve -> ${approve.status()}`).toBeTruthy();
    expect((await approve.json()).data.status).toBe('approved');

    const published = (await search()).find((p) => p.id === post.id);
    expect(published, 'approved post is publicly readable').toBeTruthy();

    // 3. Browser: the watch page renders the real post.
    await webLogin(page, CUSTOMER);
    await page.goto(`/learn/watch/${post.id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();
    await expect(page.getByText('Playwright checks the Learn 2.0')).toBeVisible();

    // 4. A threaded comment lands and is counted on the post.
    const comments = page.locator('section[aria-label="Comments"]');
    await comments.getByLabel('Comment text').fill('Useful, thanks for sharing.');
    await comments.locator('button', { hasText: 'Post' }).click();
    await expect(comments.getByText('Useful, thanks for sharing.')).toBeVisible();

    // 5. The feed card links to the same watch page.
    await page.goto('/learn/feed', { waitUntil: 'domcontentloaded' });
    const card = page.locator('article', { has: page.getByRole('heading', { name: title }) }).first();
    await expect(card).toBeVisible();
    await card.getByRole('heading', { name: title }).first().click();
    await page.waitForURL(`**/learn/watch/${post.id}`);
    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();

    // 6. No client-side error banner anywhere in the journey.
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
});

test('review console: queue counts and the reports inbox render', async ({ page, request }) => {
    const reviewerToken = await apiLogin(request, SUPER);

    const queueRes = await request.get('/api/learn/posts-queue?status=all', {
        headers: bearer(reviewerToken),
    });
    expect(queueRes.ok(), `queue -> ${queueRes.status()}`).toBeTruthy();
    const queue = await queueRes.json();
    expect(Array.isArray(queue.data), 'queue rows').toBeTruthy();
    expect(queue.counts, 'queue tab counts').toBeTruthy();
    expect(typeof queue.counts.pending).toBe('number');

    const reportsRes = await request.get('/api/learn/reports?status=open', {
        headers: bearer(reviewerToken),
    });
    expect(reportsRes.ok(), `reports -> ${reportsRes.status()}`).toBeTruthy();

    const desktopOnly = test.info().project.name === 'chromium';
    test.skip(!desktopOnly, 'admin console spec is desktop-only');

    await webLogin(page, SUPER, '/admin/dashboard');
    await page.waitForURL('**/dashboard**');
    await page.goto('/admin/learning/review', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Knowledge Feed Review' }).first()).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);

    // Tab + filter controls are wired (queue pills show real counts).
    await expect(page.getByRole('button', { name: /Queue/ }).first()).toBeVisible();

    // Reports inbox is a real second view, not a dead tab.
    await page.locator('button', { hasText: 'Reports' }).first().click();
    await expect(page.getByRole('button', { name: /open/i }).first()).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
});
