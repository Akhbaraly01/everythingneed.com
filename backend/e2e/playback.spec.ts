import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

/**
 * Internal playback — user directive: every media surface plays inside the
 * app, never by opening a new browser tab.
 *
 * Covers the healthcare virtual-consultation chain end to end: book a
 * virtual appointment through the real API, assign the professional as the
 * console does, then join the room in the browser and assert the in-app
 * room renders (Jitsi SDK mount or its same-origin-blocked iframe fallback,
 * both carry data-testid="video-room").
 */

const CUSTOMER = { email: 'customer@everythingneed.com', passwords: ['Password1', 'password'] };

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

test('feed video post mounts an in-app embed and never bounces to the provider', async ({ page }) => {
    await webLogin(page, CUSTOMER, '/learn');
    await page.goto('/learn', { waitUntil: 'domcontentloaded' });

    // Open the first video post from the free feed.
    const watchLink = page.locator('a[href^="/learn/watch/"]').first();
    await expect(watchLink).toBeVisible();
    await watchLink.click();
    await page.waitForURL('**/learn/watch/**', { timeout: 15_000 });

    // The player must mount an in-app provider frame: either the SDK player
    // or the basic-mode embed fallback - both are iframes on this page.
    await expect(
        page
            .locator('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="facebook"], iframe[src*="tiktok"]')
            .first(),
    ).toBeVisible({ timeout: 30_000 });

    // Nothing offers to leave the app to watch this video.
    await expect(page.locator('a[href*="youtube.com/watch"], a[href*="youtu.be/"]')).toHaveCount(0);
    expect(page.url()).toContain('/learn/watch/');
});

test('virtual appointment joins the in-app consultation room', async ({ page, request }) => {
    const token = await apiLogin(request, CUSTOMER);

    // 1. Pick a professional that offers virtual consultations.
    const list = await (await request.get('/api/health/doctors?virtual=true&per_page=50')).json();
    const pros = (list.data ?? []) as Array<{ id: string }>;
    expect(pros.length, 'seeded virtual professionals exist').toBeGreaterThan(0);
    const pro = pros[0];

    // 2. Book a virtual appointment on a fresh slot: bookings persist between
    //    runs and the partial unique index rejects clashes, so walk date x
    //    hour candidates (a fixed date+time goes stale after a single run).
    //    Booking with a doctor_id lands the ticket already assigned, which is
    //    exactly the joinable state.
    let ticket: { id: string; status: string } | null = null;
    outer: for (let day = 3; day <= 40; day++) {
        const date = new Date(Date.now() + day * 86400_000).toISOString().slice(0, 10);
        for (let hour = 9; hour <= 17; hour++) {
            const res = await request.post('/api/appointments', {
                headers: bearer(token),
                data: {
                    doctor_id: pro.id,
                    symptoms: 'E2E virtual playback check',
                    consultation_type: 'virtual',
                    appointment_date: date,
                    appointment_time: `${String(hour).padStart(2, '0')}:30`,
                },
            });
            if (res.status() === 201) {
                ticket = (await res.json()).data as { id: string; status: string };
                break outer;
            }
        }
    }
    expect(ticket, 'virtual ticket booked').not.toBeNull();
    expect(ticket!.status, 'booked ticket is joinable (assigned)').toBe('assigned');

    // 4. Browser: the appointment page joins the room in-app.
    await webLogin(page, CUSTOMER, '/healthcare/appointments');
    await page.goto(`/healthcare/appointments/${ticket!.id}`);

    await page.getByRole('button', { name: 'Join virtual consultation' }).click();
    await expect(page.getByTestId('video-room')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Live consultation room')).toBeVisible();
    await expect(page.getByText('Your clinician joins this same room.')).toBeVisible();

    // Nothing opened a new tab: the room is on this page.
    expect(await page.context().pages().length).toBe(1);

    // 5. Closing the room hides it and restores the join button.
    await page.getByRole('button', { name: 'Close room' }).click();
    await expect(page.getByTestId('video-room')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Join virtual consultation' })).toBeVisible();
});

const SUPER = { email: 'super@everythingneed.com', passwords: ['password', 'Password1'] };

/** Create + publish a course with one lesson through the real admin APIs. */
async function publishCourseWithLesson(
    request: import('@playwright/test').APIRequestContext,
    token: string,
    lesson: Record<string, unknown>,
): Promise<{ courseId: string; lessonId: string }> {
    const stamp = Date.now();
    const created = await request.post('/api/admin/courses', {
        headers: bearer(token),
        data: {
            title: `E2E Playback Course ${stamp}`,
            description: 'Course created by the playback e2e to prove admin-managed lessons play in-app.',
            category: 'e2e',
            course_type: 'theory',
            instructor_name: 'E2E Instructor',
            price: 0,
        },
    });
    expect(created.status(), 'course created').toBe(201);
    const courseId = (await created.json()).data.id as string;

    const lessonRes = await request.post(`/api/admin/courses/${courseId}/lessons`, {
        headers: bearer(token),
        data: lesson,
    });
    expect(lessonRes.status(), 'lesson created').toBe(201);
    const lessonId = (await lessonRes.json()).data.id as string;

    const published = await request.put(`/api/admin/courses/${courseId}/status`, {
        headers: bearer(token),
        data: { status: 'published' },
    });
    expect(published.status(), 'course published').toBe(200);

    return { courseId, lessonId };
}

test('admin-managed lesson with a YouTube video plays in-app on the lesson page', async ({ page, request }) => {
    const token = await apiLogin(request, SUPER);
    const { courseId, lessonId } = await publishCourseWithLesson(request, token, {
        title: 'E2E YouTube lesson',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration_minutes: 5,
    });

    await webLogin(page, CUSTOMER, '/learn');
    await page.goto(`/learn/courses/${courseId}/lessons/${lessonId}`, { waitUntil: 'domcontentloaded' });

    // Lesson header carries the real curriculum order from the managed row.
    await expect(page.getByText('E2E YouTube lesson')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Lesson 1 of 1')).toBeVisible();

    // The video plays inside the app (SDK player or basic-mode embed).
    await expect(page.locator('iframe[src*="youtube"]').first()).toBeVisible({ timeout: 30_000 });

    // Nothing offers to leave the app to watch it.
    await expect(page.locator('a[href*="youtube.com/watch"], a[href*="youtu.be/"]')).toHaveCount(0);
    expect(await page.context().pages().length).toBe(1);
});

test('admin-managed live-class lesson joins the in-app room', async ({ page, request }) => {
    const token = await apiLogin(request, SUPER);
    const room = `EverythingNeed-E2E-${Date.now()}`;
    const { courseId, lessonId } = await publishCourseWithLesson(request, token, {
        title: 'E2E live class',
        video_url: `https://meet.jit.si/${room}`,
    });

    await webLogin(page, CUSTOMER, '/learn');
    await page.goto(`/learn/courses/${courseId}/lessons/${lessonId}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('This lesson is a live class')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Join live class' }).click();
    await expect(page.getByTestId('video-room')).toBeVisible({ timeout: 30_000 });
    expect(await page.context().pages().length, 'the room stayed on this page').toBe(1);

    await page.getByRole('button', { name: 'Leave class' }).click();
    await expect(page.getByTestId('video-room')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Join live class' })).toBeVisible();
});
