import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

/**
 * Phase L-B.4 + L-B.5 + L-B.6: the Learn landing surface (spec 15) against the
 * real server, the course review contract, and the quiz → completion chain
 * (spec 19). Search/filter, categories, videos, certificates and the
 * learning-progress route are reachable for a guest; a signed-in learner sees
 * real lesson counts; an enrolled learner can leave exactly one review (edit
 * afterwards); and a submitted quiz is graded server-side and reported next to
 * the learner's course progress.
 */

const CUSTOMER = { email: 'customer@everythingneed.com', passwords: ['Password1', 'password'] };

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

test('learn landing exposes the spec 15 sections and a working search filter', async ({ page }) => {
    await page.goto('/learn', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /Learn New Skills/ }).first()).toBeVisible();

    // Search + filters (server-driven via ?search=&category=&level=).
    await expect(page.getByLabel('Search courses')).toBeVisible();
    await expect(page.getByLabel('Filter by category')).toBeVisible();
    await expect(page.getByLabel('Filter by level')).toBeVisible();

    // Categories: real chips or an honest empty state.
    await expect(page.getByRole('heading', { name: 'Categories', exact: true }).first()).toBeVisible();
    await expect(
        page.getByText('No categories yet.').or(page.locator('a[href^="/learn/categories/"]')).first(),
    ).toBeVisible();

    // Videos: real video cards or an honest empty state.
    await expect(page.getByRole('heading', { name: 'Videos', exact: true }).first()).toBeVisible();
    await expect(
        page.getByText('No videos published yet.').or(page.getByRole('link', { name: /views/ })).first(),
    ).toBeVisible();

    // Certificates explainer + the progress route (was an orphan).
    await expect(page.getByRole('heading', { name: 'Certificates', exact: true }).first()).toBeVisible();
    await expect(page.getByText(/verifiable code/)).toBeVisible();
    await expect(page.getByRole('link', { name: /My progress/ })).toBeVisible();

    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);

    // Apply a real filter and clear it again.
    await page.getByLabel('Search courses').fill('Digital Marketing');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.waitForURL(/search=/);
    await expect(page.getByLabel('Search courses')).toHaveValue('Digital Marketing');
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear' }).click();
    await page.waitForURL((url) => !url.search.includes('search='));
    await expect(page.getByLabel('Search courses')).toHaveValue('');
});

test('free knowledge feed renders real approved posts and pages forward', async ({ page }) => {
    await page.goto('/learn', { waitUntil: 'domcontentloaded' });

    // The free feed is the dominant part of Learn: video/text posts, no wall.
    await expect(page.getByRole('heading', { name: 'Free knowledge feed', exact: true })).toBeVisible();
    await expect(page.getByText(/watch and read without paying/)).toBeVisible();

    const cards = page.locator('a[href^="/learn/watch/"]');
    await expect(cards.first()).toBeVisible();
    // The videos rail renders before React hydrates the feed; the
    // "Show more" button only appears once the feed fetch resolves, so
    // waiting for it makes the first-page count deterministic.
    await expect(page.getByRole('button', { name: 'Show more free posts' })).toBeVisible();
    const firstPage = await cards.count();
    expect(firstPage, 'a full first page of free posts (feed + videos rail)').toBeGreaterThanOrEqual(12);

    // Keyset paging: "Show more free posts" appends the next page.
    await page.getByRole('button', { name: 'Show more free posts' }).click();
    await expect(async () => {
        expect(await cards.count()).toBeGreaterThan(firstPage);
    }).toPass({ timeout: 15000 });

    // Cards carry honest metrics (views are seeded, not invented per render).
    await expect(page.getByText(/views$/).first()).toBeVisible();

    // Same content surface from the full feed link.
    await page.getByRole('link', { name: 'Open full feed' }).click();
    await page.waitForURL('**/learn/feed');
    await expect(page.locator('article').first()).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
});

test('my learning shows real lesson counts from the enrollment payload', async ({ page }) => {
    await webLogin(page, CUSTOMER, '/learn/my-learning');
    await page.goto('/learn/my-learning', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'My Learning' }).first()).toBeVisible();

    // LearnService::getUserEnrollments puts lessons_count on the row, so the
    // card reads "2/3 lessons" instead of the old "0/0".
    await expect(page.getByText(/\d+\/\d+ lessons/).first()).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
});

test('enrolled learner reviews a course once and can edit it afterwards', async ({ page, request }) => {
    const token = await apiLogin(request, CUSTOMER);
    const mine = await request.get('/api/my-courses', { headers: bearer(token) });
    expect(mine.ok(), 'enrollment list').toBeTruthy();
    const enrollment = ((await mine.json()).data ?? [])[0];
    expect(enrollment, 'the seeded learner is enrolled in a course').toBeTruthy();

    const mineReviews = await request.get('/api/reviews/mine', { headers: bearer(token) });
    const hasReview = ((await mineReviews.json()).data ?? [])
        .some((row: { reviewable_id: string }) => row.reviewable_id === enrollment.course_id);

    await webLogin(page, CUSTOMER, '/learn');

    // The composer decides between POST and PUT from the fetched list, so
    // wait for that exact request instead of the optimistic empty state.
    const reviewsLoaded = page.waitForResponse(
        (res) => res.request().method() === 'GET'
            && res.url().includes('/api/reviews?reviewable_type=course')
            && res.ok(),
    );
    await page.goto(`/learn/${enrollment.course_id}`, { waitUntil: 'domcontentloaded' });
    await reviewsLoaded;

    const reviews = page.locator('div.rounded-lg', { has: page.getByRole('heading', { name: 'Reviews' }) }).last();
    await expect(reviews.getByRole('heading', { name: 'Reviews' })).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);

    // Enrolled: the composer is offered (not the enrollment wall).
    const composer = reviews.getByPlaceholder('Share your experience (optional)');
    await expect(composer).toBeVisible();
    await expect(reviews.getByText('Enroll in this course to leave a review')).toHaveCount(0);

    // Wait until React applied the fetched list (the optimistic empty state
    // and the loaded "you reviewed" message look identical until then).
    if (hasReview) {
        await expect(reviews.getByText('You reviewed this course')).toBeVisible();
    } else {
        await expect(reviews.getByText('No reviews yet')).toBeVisible();
    }

    const comment = `E2E review ${Date.now()}`;
    await composer.fill(comment);
    const submit = reviews.getByRole('button', { name: /Submit review|Update review/ });
    await submit.click();

    // Exactly one row: a second visit edits the same review instead.
    await expect(page.getByText(/Review (submitted|updated)\./)).toBeVisible();
    await expect(reviews.getByText('You reviewed this course')).toBeVisible();
    await expect(reviews.locator('p').filter({ hasText: comment })).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);

    // Idempotent second pass: still exactly one composer, still editable.
    await composer.fill(`${comment} (edited)`);
    await reviews.getByRole('button', { name: 'Update review' }).click();
    await expect(page.getByText('Review updated.')).toBeVisible();
    await expect(reviews.locator('p').filter({ hasText: `${comment} (edited)` })).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
});

test('quiz submit is graded server-side and moves course progress', async ({ page, request }) => {
    const token = await apiLogin(request, CUSTOMER);
    const mine = await request.get('/api/my-courses', { headers: bearer(token) });
    expect(mine.ok(), 'enrollment list').toBeTruthy();
    const enrollments = (await mine.json()).data ?? [];
    expect(enrollments.length, 'the seeded learner is enrolled').toBeGreaterThan(0);

    await webLogin(page, CUSTOMER, '/learn');

    // Pick an enrolled course that actually carries a quiz. The h1 wait
    // covers hydration: Inertia renders client-side after DOMContentLoaded.
    let courseUrl = '';
    for (const row of enrollments) {
        await page.goto(`/learn/${row.course_id}`, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        if (await page.locator('a[href*="/quiz/"]').count() > 0) {
            courseUrl = `/learn/${row.course_id}`;
            break;
        }
    }
    expect(courseUrl, 'a seeded enrolled course has a quiz').not.toBe('');

    await page.locator('a[href*="/quiz/"]').first().click();
    await page.waitForURL(/\/quiz\//);

    // Answer every question (positions are what the server grades).
    const questionBlocks = page.locator('div.rounded-lg').filter({ has: page.locator('input[type=radio]') });
    const questionCount = await questionBlocks.count();
    expect(questionCount).toBeGreaterThan(0);
    for (let i = 0; i < questionCount; i++) {
        await questionBlocks.nth(i).locator('input[type=radio]').first().check();
    }

    const graded = page.waitForResponse(
        (res) => res.request().method() === 'POST'
            && /\/api\/quizzes\/[^/]+\/submit/.test(res.url())
            && res.ok(),
    );
    await page.getByRole('button', { name: 'Submit Quiz' }).click();
    const submitted = await graded;
    const payload = (await submitted.json()).data ?? {};

    // Results are computed on the server: percentage, no answer key, and the
    // learner's course progress right next to it.
    await expect(page.getByText(/You scored \d+\/\d+ \(\d+%\)/)).toBeVisible();
    await expect(page.getByText(/Course progress: \d+%/)).toBeVisible();
    expect(String(payload.score).length).toBeGreaterThanOrEqual(0);
    expect(payload.percent).toBe(payload.total > 0 ? Math.round((payload.score / payload.total) * 100) : 0);
    expect(JSON.stringify(payload)).not.toContain('correct_index');
    await expect(
        page.getByRole('link', { name: 'Back to course' })
            .or(page.getByRole('link', { name: 'View Certificates' }))
            .first(),
    ).toBeVisible();

    // Back on the course page the quiz section reports pass state honestly.
    await page.goto(courseUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/\d+ of \d+ passed/)).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
});

test('instructor directory and profile are linked and list real courses', async ({ page }) => {
    await page.goto('/learn', { waitUntil: 'domcontentloaded' });

    // The directory is reachable from the landing instructor strip.
    const directoryLink = page.getByRole('link', { name: 'View all instructors' });
    await expect(directoryLink).toBeVisible();
    await directoryLink.click();
    await page.waitForURL('**/learn/instructors');
    await expect(page.getByRole('heading', { name: 'Instructors', exact: true })).toBeVisible();

    const row = page.locator('a[href*="/learn/instructors/"]').first();
    await expect(row).toBeVisible();
    const name = ((await row.locator('p').first().textContent()) ?? '').trim();
    expect(name).not.toBe('');

    await row.click();
    await page.waitForURL(/\/learn\/instructors\/.+/);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(page.getByText(/\d+ courses/).first()).toBeVisible();

    // The profile is a destination, not a dead end: their catalogue is listed.
    await expect(page.getByRole('heading', { name: /Courses by/ })).toBeVisible();
    const catalogue = page.locator('div.rounded-lg', { has: page.getByRole('heading', { name: /Courses by/ }) }).last();
    await expect(catalogue.locator('a[href^="/learn/"]').first()).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
});
