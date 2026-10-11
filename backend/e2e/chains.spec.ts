import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

/**
 * W4 (spec 96/100/39/63) — end-to-end journey chains: multi-step user
 * lifecycles exercised against the real API, then verified in the browser.
 * Chains are idempotent per run (unique titles/keys), never destructive.
 *
 * Sign-ins reuse the shared cached-session helpers (login is throttled to
 * ten attempts per minute, and this suite logs in far more often than that).
 */

const CUSTOMER = { email: 'user@everythingneed.com', passwords: ['Password1', 'password'] };
const VENDOR = { email: 'vendor@everythingneed.com', passwords: ['Password1', 'password'] };
const SUPER = { email: 'super@everythingneed.com', passwords: ['password', 'Password1'] };

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

test('service booking chain: book -> pay -> visible in UI -> cancel refunds', async ({
    page,
    request,
}) => {
    const token = await apiLogin(request, CUSTOMER);

    // Discover a booking-ready active service (seeded demo), else create one.
    const list = await (
        await request.get('/api/services?category=building', {
            headers: bearer(token),
        })
    ).json();
    let service = ((list.data ?? []) as Array<{
        id: string;
        status: string;
        requires_booking: boolean;
    }>).find((s) => s.status === 'active' && s.requires_booking);

    if (!service) {
        const adminToken = await apiLogin(request, SUPER);
        const createRes = await request.post('/api/admin/services', {
            headers: bearer(adminToken),
            data: {
                name: `E2E Window Cleaning ${Date.now()}`,
                category: 'Building Services',
                description: 'Playwright chain service',
                pricing_mode: 'fixed',
                base_price: 25,
                currency: 'USD',
                status: 'active',
                requires_booking: true,
                location: 'Accra',
            },
        });
        expect(createRes.status(), 'admin creates chain service').toBe(201);
        service = (await createRes.json()).data;
    }

    // 1. Customer books the service.
    const bookRes = await request.post(`/api/services/${service.id}/book`, {
        headers: bearer(token),
        data: { notes: 'Playwright chain booking' },
    });
    expect(bookRes.status(), 'book service').toBe(201);
    const booking = (await bookRes.json()).data as {
        id: string;
        booking_number: string;
    };
    expect(booking.booking_number).toMatch(/^SVC-/);

    // 2. Pay through the payment service.
    const payRes = await request.post(
        `/api/services/bookings/${booking.id}/pay`,
        { headers: bearer(token), data: { method: 'card' } }
    );
    expect(payRes.ok(), `pay booking -> ${payRes.status()}`).toBeTruthy();
    const paid = (await payRes.json()).data as { payment_status: string };
    expect(paid.payment_status).toBe('paid');

    // 3. The booking shows in the customer's own list.
    const mine = await (
        await request.get('/api/services/bookings/mine', { headers: bearer(token) })
    ).json();
    expect(
        (mine.data ?? []).some(
            (b: { booking_number: string }) => b.booking_number === booking.booking_number
        ),
        'booking visible in mine list'
    ).toBe(true);

    // 4. Browser: the same booking renders on the public building-services page.
    await webLogin(page, CUSTOMER);
    await page.goto('/building-services', { waitUntil: 'domcontentloaded' });
    await expect(
        page.getByRole('heading', { name: 'My service bookings' })
    ).toBeVisible();
    await expect(page.getByText(booking.booking_number).first()).toBeVisible();

    // 5. Cancel after payment -> refund path.
    const cancelRes = await request.post(
        `/api/services/bookings/${booking.id}/cancel`,
        { headers: bearer(token) }
    );
    expect(cancelRes.ok(), `cancel booking -> ${cancelRes.status()}`).toBeTruthy();
    const cancelled = (await cancelRes.json()).data as {
        status: string;
        payment_status: string;
    };
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.payment_status).toBe('refunded');
});

test('need request chain: post -> offer -> accept -> pay -> complete -> visible in UI', async ({
    page,
    request,
}) => {
    const customerToken = await apiLogin(request, CUSTOMER);
    const vendorToken = await apiLogin(request, VENDOR);
    const title = `E2E need ${Date.now()}`;

    // 1. Customer posts a need.
    const created = await request.post('/api/need-requests', {
        headers: bearer(customerToken),
        data: {
            title,
            description: 'Playwright chain need request',
            budget_min: 10,
            budget_max: 50,
            currency: 'USD',
        },
    });
    expect(created.status(), 'create need').toBe(201);
    const createdBody = await created.json();
    const needId = createdBody.data.id as string;
    expect(createdBody.data.status).toBe('pending');

    // 2. A different provider bids.
    const offer = await request.post(`/api/need-requests/${needId}/offers`, {
        headers: bearer(vendorToken),
        data: { price: 35, message: 'Playwright chain offer' },
    });
    expect(offer.status(), 'submit offer').toBe(201);
    const offerId = (await offer.json()).data.id as string;

    // 3. Customer accepts the offer.
    const accept = await request.post(
        `/api/need-requests/${needId}/offers/${offerId}/accept`,
        { headers: bearer(customerToken) }
    );
    expect(accept.ok(), `accept offer -> ${accept.status()}`).toBeTruthy();
    expect((await accept.json()).data.request.status).toBe('accepted');

    // 4. Customer pays the accepted offer amount.
    const pay = await request.post(`/api/need-requests/${needId}/pay`, {
        headers: bearer(customerToken),
        data: { method: 'card' },
    });
    expect(pay.status(), 'pay need').toBe(201);
    expect((await pay.json()).data.request_status).toBe('paid');

    // 5. Provider starts and completes the work.
    const start = await request.post(`/api/need-requests/${needId}/start`, {
        headers: bearer(vendorToken),
    });
    expect(start.ok(), `start -> ${start.status()}`).toBeTruthy();
    const complete = await request.post(`/api/need-requests/${needId}/complete`, {
        headers: bearer(vendorToken),
    });
    expect(complete.ok(), `complete -> ${complete.status()}`).toBeTruthy();
    expect((await complete.json()).data.status).toBe('completed');

    // 6. Browser: the finished need sits on the customer's My Needs board.
    await webLogin(page, CUSTOMER);
    await page.goto('/needs/my-needs', { waitUntil: 'domcontentloaded' });
    // AppLayout title + page h1 both render - first() avoids the strict violation.
    await expect(
        page.getByRole('heading', { name: 'My Needs' }).first()
    ).toBeVisible();
    await expect(page.getByText(title).first()).toBeVisible();
});

test('wallet deposit chain: API deposit increments balance shown on the wallet page', async ({
    page,
    request,
}) => {
    const token = await apiLogin(request, CUSTOMER);

    const readBalance = async (): Promise<number> => {
        const res = await request.get('/api/wallet/balance', {
            headers: bearer(token),
        });
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        return Number(body.data.balance);
    };

    const before = await readBalance();

    const deposit = await request.post('/api/wallet/deposit', {
        headers: bearer(token),
        data: {
            amount: 15.5,
            payment_method: 'card',
            idempotency_key: `e2e-wallet-${Date.now()}`,
        },
    });
    expect(deposit.ok(), `deposit -> ${deposit.status()}`).toBeTruthy();

    const after = await readBalance();
    expect(after).toBeCloseTo(before + 15.5, 2);

    // Browser: wallet page renders the balance card without erroring.
    await webLogin(page, CUSTOMER);
    await page.goto('/wallet', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Available Balance')).toBeVisible();
    await expect(page.getByText('An unexpected error occurred.')).toHaveCount(0);
});
