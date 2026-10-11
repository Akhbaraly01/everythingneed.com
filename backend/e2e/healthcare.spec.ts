import { test, expect } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

/**
 * Phase H-A — Healthcare journey chains (spec 21-25) exercised against the
 * real API, then verified in the browser. Chains are idempotent per run
 * (unique dates/notes), never destructive.
 *
 * Sign-ins reuse the shared cached-session helpers (login is throttled to
 * ten attempts per minute, and this suite logs in far more often than that).
 */

const CUSTOMER = { email: 'customer@everythingneed.com', passwords: ['Password1', 'password'] };
const SUPER = { email: 'super@everythingneed.com', passwords: ['password', 'Password1'] };
const DONOR = { email: 'user@everythingneed.com', passwords: ['Password1', 'password'] };

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

// The admin console (Healthcare workspace) is desktop-only, matching the
// other console specs.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
    if (testInfo.title.includes('admin console')) {
        test.skip(testInfo.project.name !== 'chromium', 'admin console is desktop-only');
    }
});

test('lab booking chain: browse -> book -> pay -> visible in detail -> appears in history', async ({
    page,
    request,
}) => {
    const token = await apiLogin(request, CUSTOMER);

    // 1. Discover a bookable active lab test (seeded demo catalog).
    const list = await (await request.get('/api/health/labs', { headers: bearer(token) })).json();
    const tests = (list.data ?? []) as Array<{
        id: string;
        name: string;
        preparation_instructions?: string | null;
        result_time_hours?: number | null;
        price: number;
    }>;
    expect(tests.length, 'seeded active lab tests exist').toBeGreaterThan(0);
    const lab = tests[0];

    // 2. Book a free slot. There is no availability endpoint, so walk candidate
    // date+slot pairs until one is accepted: bookings persist between runs and
    // the partial unique index rejects a clash, so a fixed date goes stale fast
    // (every prior run consumed one slot per date). The API validates
    // appointment_time as H:i, so the hour is zero-padded.
    let bookRes: Awaited<ReturnType<typeof request.post>> | null = null;
    outer: for (let day = 3; day <= 14; day++) {
        const date = new Date(Date.now() + day * 86400_000).toISOString().slice(0, 10);
        for (let hour = 9; hour <= 17; hour++) {
            const candidate = `${String(hour).padStart(2, '0')}:00`;
            const res = await request.post('/api/health/labs/book', {
                headers: bearer(token),
                data: {
                    lab_test_id: lab.id,
                    appointment_date: date,
                    appointment_time: candidate,
                    notes: 'Playwright healthcare chain',
                },
            });
            if (res.ok()) {
                bookRes = res;
                break outer;
            }
            const body = await res.text();
            if (!body.includes('already booked')) {
                throw new Error(`book lab test -> ${res.status()} (${date} ${candidate}): ${body}`);
            }
        }
    }
    expect(bookRes, `no free lab slot across the next 12 days`).not.toBeNull();
    expect(bookRes!.status(), 'book lab test').toBe(201);
    const booking = (await bookRes!.json()).data as {
        id: string;
        booking_number: string;
        status: string;
        is_paid: boolean;
    };
    expect(booking.booking_number).toMatch(/^LB-/);
    expect(booking.status).toBe('pending');
    expect(booking.is_paid).toBe(false);

    // 3. Pay the pending booking.
    const payRes = await request.post(`/api/health/labs/bookings/${booking.id}/pay`, {
        headers: bearer(token),
        data: { method: 'card' },
    });
    expect(payRes.ok(), `pay booking -> ${payRes.status()}`).toBeTruthy();
    const paid = (await payRes.json()).data as { status: string; is_paid: boolean };
    expect(paid.status).toBe('confirmed');
    expect(paid.is_paid).toBe(true);

    // 4. The booking is retrievable via its detail endpoint (the page's data source).
    const detailRes = await request.get(`/api/health/labs/bookings/${booking.id}`, {
        headers: bearer(token),
    });
    expect(detailRes.ok(), `booking detail -> ${detailRes.status()}`).toBeTruthy();
    const detail = (await detailRes.json()).data as {
        booking_number: string;
        status: string;
        lab_test?: { id?: string; preparation_instructions?: string | null; result_time_hours?: number | null };
    };
    expect(detail.booking_number).toBe(booking.booking_number);
    expect(detail.status).toBe('confirmed');
    expect(detail.lab_test?.id).toBe(lab.id);
    // Prep and turnaround are real catalog facts the detail page surfaces.
    expect(detail.lab_test?.preparation_instructions).toBeTruthy();
    expect(detail.lab_test?.result_time_hours).toBeGreaterThan(0);

    // 5. The booking shows in the patient's own history list.
    const history = await (
        await request.get('/api/health/labs/bookings?per_page=50', { headers: bearer(token) })
    ).json();
    const ids = ((history.data ?? []) as Array<{ id: string }>).map((b) => b.id);
    expect(ids, 'booking visible in history').toContain(booking.id);

    // 6. Verify in the browser: the catalog lists the booked test with prep facts.
    await webLogin(page, CUSTOMER, '/healthcare/labs');
    await page.goto('/healthcare/labs');
    await expect(page.getByRole('heading', { name: /lab/i }).first()).toBeVisible();
    await expect(page.getByText(lab.name).first()).toBeVisible();
    // The enriched card surfaces the turnaround fact the API returned.
    if (lab.result_time_hours != null) {
        await expect(page.getByText(new RegExp(`${lab.result_time_hours}`, 'i')).first()).toBeVisible();
    }

    // 7. The detail page renders the booked test and its preparation instructions.
    await page.goto(`/healthcare/labs/${lab.id}`);
    await expect(page.getByText(lab.name).first()).toBeVisible();
    if (lab.preparation_instructions) {
        await expect(page.getByText(lab.preparation_instructions).first()).toBeVisible();
    }

    // 8. History page lists the booking number.
    await page.goto('/healthcare/labs/bookings');
    await expect(page.getByText(booking.booking_number).first()).toBeVisible();
});

test('lab admin console: super admin lists + creates a test, sees it active, then deactivates', async ({
    page,
    request,
}) => {
    const token = await apiLogin(request, SUPER);

    // 1. The admin catalog list is reachable and includes seeded tests.
    const before = await (
        await request.get('/api/admin/healthcare/labs', { headers: bearer(token) })
    ).json();
    expect((before.data ?? []).length, 'admin sees seeded lab tests').toBeGreaterThan(0);

    // 2. Create a unique test so the run is idempotent.
    const name = `E2E Lab Panel ${Date.now()}`;
    const createRes = await request.post('/api/admin/healthcare/labs', {
        headers: bearer(token),
        data: {
            name,
            category: 'Chemistry',
            price: 19.5,
            result_time_hours: 24,
            preparation_instructions: 'Fast 8 hours before the draw.',
        },
    });
    expect(createRes.status(), `admin creates lab test -> ${createRes.status()}`).toBe(201);
    const created = (await createRes.json()).data as { id: string; is_active: boolean };
    expect(created.is_active).toBe(true);

    // 3. It is immediately bookable on the public catalog.
    const publicList = await (
        await request.get('/api/health/labs', { headers: bearer(token) })
    ).json();
    const publicIds = ((publicList.data ?? []) as Array<{ id: string }>).map((t) => t.id);
    expect(publicIds, 'created test is publicly listed').toContain(created.id);

    // 4. Deactivate it; it disappears from the public catalog but stays in the admin list.
    const off = await request.put(`/api/admin/healthcare/labs/${created.id}`, {
        headers: bearer(token),
        data: { is_active: false },
    });
    expect(off.ok(), `deactivate -> ${off.status()}`).toBeTruthy();

    const afterPublic = await (
        await request.get('/api/health/labs', { headers: bearer(token) })
    ).json();
    const afterIds = ((afterPublic.data ?? []) as Array<{ id: string }>).map((t) => t.id);
    expect(afterIds, 'deactivated test is publicly hidden').not.toContain(created.id);

    const afterAdmin = await (
        await request.get('/api/admin/healthcare/labs', { headers: bearer(token) })
    ).json();
    const adminIds = ((afterAdmin.data ?? []) as Array<{ id: string }>).map((t) => t.id);
    expect(adminIds, 'deactivated test stays in the admin list').toContain(created.id);

    // 5. Verify the admin console renders the Lab Tests tab in the browser.
    // The healthcare workspace is served at /admin/healthcare/doctors.
    await webLogin(page, SUPER, '/admin/dashboard');
    await expect(page.locator('#login-email')).toHaveCount(0);
    await page.goto('/admin/healthcare/doctors');
    await page.getByRole('button', { name: /Lab Tests/i }).click();
    // The labs table renders these column headers once the tab is active.
    await expect(page.getByRole('columnheader', { name: 'Result (hrs)' })).toBeVisible();
    // The seeded catalog shows real names in the table.
    await expect(page.getByText(/Complete Blood Count|CBC/i).first()).toBeVisible();
});

test('aid chain: customer files -> hidden while pending -> admin approves -> public + donate', async ({
    page,
    request,
}) => {
    const customerToken = await apiLogin(request, CUSTOMER);
    const title = `E2E Aid ${Date.now()}`;

    // 1. Customer files a pending request (no money moves).
    const fileRes = await request.post('/api/health/aid', {
        headers: bearer(customerToken),
        data: {
            title,
            description: 'E2E: community medical transport support.',
            category: 'transport',
            goal_amount: 200,
            idempotency_key: `e2e-aid-${Date.now()}`,
        },
    });
    expect(fileRes.status(), `file aid request -> ${fileRes.status()}`).toBe(201);
    const aid = (await fileRes.json()).data as { id: string; status: string };
    expect(aid.status).toBe('pending');

    // 2. Pending requests are invisible on the public listing.
    const hidden = await (await request.get('/api/health/aid?per_page=50')).json();
    const hiddenIds = ((hidden.data ?? []) as Array<{ id: string }>).map((r) => r.id);
    expect(hiddenIds, 'pending request is not public').not.toContain(aid.id);

    // 3. Super admin approves it from the review queue.
    const superToken = await apiLogin(request, SUPER);
    const approveRes = await request.put(`/api/admin/healthcare/aid/${aid.id}`, {
        headers: bearer(superToken),
        data: { action: 'approve' },
    });
    expect(approveRes.ok(), `approve aid -> ${approveRes.status()}`).toBeTruthy();
    expect((await approveRes.json()).data.status).toBe('approved');

    // 4. Now it is publicly listed.
    const publicNow = await (await request.get('/api/health/aid?per_page=50')).json();
    const publicIds = ((publicNow.data ?? []) as Array<{ id: string }>).map((r) => r.id);
    expect(publicIds, 'approved request is public').toContain(aid.id);

    // 5. A different user donates; the raised amount tracks the ledger.
    const donorToken = await apiLogin(request, DONOR);
    const donateRes = await request.post(`/api/health/aid/${aid.id}/donate`, {
        headers: bearer(donorToken),
        data: { amount: 50, method: 'card' },
    });
    expect(donateRes.ok(), `donate -> ${donateRes.status()}`).toBeTruthy();
    const donation = (await donateRes.json()).data as { amount: number; status: string };
    expect(donation.status).toBe('completed');

    const detail = await (await request.get(`/api/health/aid/${aid.id}`)).json();
    expect(Number(detail.data.raised_amount)).toBeGreaterThanOrEqual(50);

    // 6. Browser: the public page shows the approved request.
    await webLogin(page, CUSTOMER, '/healthcare/aid');
    await page.goto('/healthcare/aid');
    await expect(page.getByText(title).first()).toBeVisible();

    // 7. Admin review queue renders the pending seeded request with actions.
    await webLogin(page, SUPER, '/admin/dashboard');
    await expect(page.locator('#login-email')).toHaveCount(0);
    await page.goto('/admin/healthcare/aid');
    await expect(page.getByRole('heading', { name: /Healthcare Aid Review/i }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Requester' })).toBeVisible();
    // The seeded AID-DEMO-3 request is always pending, so Approve/Reject render.
    await expect(page.getByRole('button', { name: 'Approve' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reject' }).first()).toBeVisible();
});

test('prescription chain: expired/filled blocked -> order active -> cancel keeps it active -> pages render', async ({
    page,
    request,
}) => {
    const token = await apiLogin(request, CUSTOMER);

    // 1. The seeded lifecycle prescriptions belong to the customer account.
    const list = await (await request.get('/api/prescriptions?per_page=50', { headers: bearer(token) })).json();
    const all = (list.data ?? []) as Array<{ id: string; code: string; status: string; expires_at: string | null }>;
    const byCode = (code: string) => all.find((p) => p.code === code);
    const active = byCode('RX-LIFECYCLE-ACTIVE');
    const expired = byCode('RX-LIFECYCLE-EXPIRED');
    const filled = byCode('RX-LIFECYCLE-FILLED');
    expect(active, 'RX-LIFECYCLE-ACTIVE seeded').toBeTruthy();
    expect(expired, 'RX-LIFECYCLE-EXPIRED seeded').toBeTruthy();
    expect(filled, 'RX-LIFECYCLE-FILLED seeded').toBeTruthy();
    expect(active!.status).toBe('active');
    expect(expired!.status).toBe('expired');

    // 2. Non-active prescriptions cannot be ordered (no state change either way).
    const blockedExpired = await request.post(`/api/prescriptions/${expired!.id}/order`, {
        headers: bearer(token),
        data: { items: [{ name: 'Metformin', quantity: 1 }] },
    });
    expect(blockedExpired.status(), 'ordering an expired prescription').toBe(422);
    const blockedFilled = await request.post(`/api/prescriptions/${filled!.id}/order`, {
        headers: bearer(token),
        data: { items: [{ name: 'Lisinopril', quantity: 1 }] },
    });
    expect(blockedFilled.status(), 'ordering a filled prescription').toBe(422);

    // 3. Ordering the active prescription creates a linked, priced order.
    const orderRes = await request.post(`/api/prescriptions/${active!.id}/order`, {
        headers: bearer(token),
        data: { items: [{ name: 'Amoxicillin', quantity: 1 }], delivery_address: 'E2E chain address' },
    });
    expect(orderRes.status(), `order active prescription -> ${orderRes.status()}`).toBe(201);
    const order = (await orderRes.json()).data as {
        id: string;
        order_number: string;
        status: string;
        prescription_id: string;
        total_amount: number;
    };
    expect(order.order_number).toMatch(/^MED-/);
    expect(order.status).toBe('pending');
    expect(order.prescription_id).toBe(active!.id);
    // decimal:2 casts serialize as strings in JSON.
    expect(Number(order.total_amount)).toBeGreaterThan(0);

    // 4. The patient sees the linked order in their own pharmacy history.
    const mine = await (
        await request.get('/api/pharmacy/orders?per_page=50', { headers: bearer(token) })
    ).json();
    const mineIds = ((mine.data ?? []) as Array<{ id: string }>).map((o) => o.id);
    expect(mineIds, 'order visible in patient history').toContain(order.id);

    // 5. Fulfilment completes the order. Cancellation restocks and must NOT
    //    mark the prescription filled (only delivery does, pinned in
    //    PrescriptionLifecycleTest) — that keeps this chain re-runnable.
    const superToken = await apiLogin(request, SUPER);
    const cancelRes = await request.post(`/api/admin/pharmacy/orders/${order.id}/cancel`, {
        headers: bearer(superToken),
    });
    expect(cancelRes.ok(), `admin cancel -> ${cancelRes.status()}`).toBeTruthy();
    const stillActive = await (
        await request.get(`/api/prescriptions/${active!.id}`, { headers: bearer(token) })
    ).json();
    expect(stillActive.data.status, 'cancel does not fill the prescription').toBe('active');

    // 6. Admin oversight lists the prescription with patient + meta envelope.
    const oversight = await (
        await request.get('/api/admin/pharmacy/prescriptions?status=active', { headers: bearer(superToken) })
    ).json();
    expect(Array.isArray(oversight.data), 'oversight envelope has data[]').toBe(true);
    expect(oversight.meta?.page, 'oversight envelope has meta.page').toBeTruthy();
    const oversightCodes = (oversight.data ?? []).map((p: { code: string }) => p.code);
    expect(oversightCodes, 'active prescription is listed').toContain('RX-LIFECYCLE-ACTIVE');
    const oversightRow = (oversight.data ?? []).find((p: { code: string }) => p.code === 'RX-LIFECYCLE-ACTIVE');
    expect(oversightRow.patient?.email).toBe(CUSTOMER.email);
    const badFilter = await request.get('/api/admin/pharmacy/prescriptions?status=bogus', {
        headers: bearer(superToken),
    });
    expect(badFilter.status(), 'status filter is validated').toBe(422);

    // 7. Browser: patient prescriptions page renders every lifecycle status
    //    and the send-to-pharmacy action on the active one.
    await webLogin(page, CUSTOMER, '/healthcare/prescriptions');
    await page.goto('/healthcare/prescriptions');
    await expect(page.getByRole('heading', { name: /^Prescriptions$/ }).first()).toBeVisible();
    await expect(page.getByText('RX-LIFECYCLE-ACTIVE').first()).toBeVisible();
    await expect(page.getByText('RX-LIFECYCLE-EXPIRED').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send to pharmacy' }).first()).toBeVisible();
    await expect(page.getByText('Expired', { exact: true }).first()).toBeVisible();

    // 8. Browser: patient records page shows the prescription timeline.
    await page.goto('/healthcare/records');
    // AppLayout renders `title` as an h1 and the page keeps its own — the
    // established healthcare-page pattern, so scope to the first heading.
    await expect(page.getByRole('heading', { name: 'My health records' }).first()).toBeVisible();
    await expect(page.getByText(/RX-LIFECYCLE/).first()).toBeVisible();

    // 9. Browser: admin pharmacy console Prescriptions tab lists the codes.
    await webLogin(page, SUPER, '/admin/dashboard');
    await expect(page.locator('#login-email')).toHaveCount(0);
    await page.goto('/admin/pharmacy');
    await page.getByRole('button', { name: 'Prescriptions' }).first().click();
    // DataTable keeps both layouts in the DOM and toggles visibility with
    // CSS, so match only the rendered copy.
    const visibleText = (name: string) => page.getByText(name).locator('visible=true').first();
    await expect(visibleText('RX-LIFECYCLE-ACTIVE')).toBeVisible();
    await expect(visibleText('RX-LIFECYCLE-FILLED')).toBeVisible();
    await expect(visibleText('customer@everythingneed.com')).toBeVisible();
});

test('bookings hub: tiles navigate hub, aid, labs and documents', async ({ page }) => {
    // Navigation-heavy chain (15+ page loads on the single-worker dev
    // server): needs headroom over the 90s file default.
    test.setTimeout(180_000);
    await webLogin(page, CUSTOMER, '/healthcare');

    // 1. Hub tiles reach the new destinations.
    await page.goto('/healthcare');
    await page.getByRole('link', { name: 'Health Bookings' }).click();
    await expect(page).toHaveURL(/\/healthcare\/bookings$/);
    await expect(page.getByRole('heading', { name: 'Health Bookings' }).first()).toBeVisible();
    await expect(page.getByText('Appointments & Virtual Consults').first()).toBeVisible();
    await expect(page.getByText('Home Visits').first()).toBeVisible();
    await expect(page.getByText('Others').first()).toBeVisible();

    // 2. Hub sections reach their pages.
    await page.getByRole('link', { name: 'My Appointments' }).click();
    await expect(page).toHaveURL(/\/healthcare\/appointments$/);
    await page.goto('/healthcare/bookings');
    await page.getByRole('link', { name: 'Book a Home Visit' }).click();
    await expect(page).toHaveURL(/\/healthcare\/bookings\/home-visit$/);
    await page.goto('/healthcare/bookings');
    await page.getByRole('link', { name: 'Make a Request' }).click();
    await expect(page).toHaveURL(/\/healthcare\/bookings\/others$/);

    // 3. Aid and hub stay bidirectionally linked.
    await page.goto('/healthcare');
    await page.getByRole('link', { name: 'Healthcare Aid' }).click();
    await expect(page).toHaveURL(/\/healthcare\/aid$/);
    await page.getByRole('link', { name: /Back to Healthcare/ }).click();
    await expect(page).toHaveURL(/\/healthcare$/);

    // 4. Documentation hub sections render with view-all links.
    await page.goto('/healthcare/documents');
    await expect(page.getByRole('heading', { name: 'Documentation' }).first()).toBeVisible();
    await expect(page.getByText('Prevention Guides').first()).toBeVisible();
    await page.getByRole('link', { name: /View all/ }).first().click();
    await expect(page).toHaveURL(/\/healthcare\/(videos|guides)$/);
});

test('home-visit chain: book with address, per-professional fee, admin sees type', async ({
    page,
    request,
}) => {
    const token = await apiLogin(request, CUSTOMER);

    // 1. Pick a professional with a home-visit fee via the API.
    const list = await (await request.get('/api/health/doctors?per_page=50')).json();
    const pros = (list.data ?? []) as Array<{ id: string; home_visit_fee?: number | string | null; consultation_fee: number }>;
    expect(pros.length, 'seeded professionals exist').toBeGreaterThan(0);
    const pro = pros.find((p) => Number(p.home_visit_fee) > 0) ?? pros[0];
    const expectedFee = Number(pro.home_visit_fee) > 0 ? Number(pro.home_visit_fee) : Number(pro.consultation_fee);

    // 2. Book a home visit on a fresh slot (walk dates like the lab chain).
    const address = `E2E Home ${Date.now()}, Accra`;
    let ticket: { id: string } | null = null;
    for (let day = 30; day <= 40 && !ticket; day++) {
        const date = new Date(Date.now() + day * 86400_000).toISOString().slice(0, 10);
        const res = await request.post('/api/appointments', {
            headers: bearer(token),
            data: {
                doctor_id: pro.id,
                symptoms: 'E2E home visit check',
                consultation_type: 'home_visit',
                home_address: address,
                appointment_date: date,
                appointment_time: '10:00',
            },
        });
        if (res.status() === 201) ticket = (await res.json()).data as { id: string };
    }
    expect(ticket, 'home-visit ticket booked').not.toBeNull();

    // 3. Fee matches the professional's home-visit price; address persisted.
    const detail = await (await request.get(`/api/appointments/${ticket!.id}`, { headers: bearer(token) })).json();
    expect(detail.data.consultation_type).toBe('home_visit');
    expect(detail.data.home_address).toBe(address);
    expect(Number(detail.data.consultation_fee)).toBe(expectedFee);

    // 4. Admin tickets queue shows the home-visit type.
    const superToken = await apiLogin(request, SUPER);
    const queue = await (await request.get('/api/admin/healthcare/tickets?per_page=50', { headers: bearer(superToken) })).json();
    const rows = (queue.data ?? []) as Array<{ id: string; consultation_type?: string }>;
    expect(rows.find((r) => r.id === ticket!.id)?.consultation_type).toBe('home_visit');

    // 5. Browser: the home-visit page renders professionals with per-visit prices.
    await webLogin(page, CUSTOMER, '/healthcare/bookings/home-visit');
    await page.goto('/healthcare/bookings/home-visit');
    await expect(page.getByRole('heading', { name: 'Home Visit' }).first()).toBeVisible();
    await expect(page.getByText(/\/ visit/).first()).toBeVisible();
});

test('others chain: file custom request, mine, admin advances, note visible', async ({
    page,
    request,
}) => {
    const token = await apiLogin(request, CUSTOMER);
    const title = `E2E Request ${Date.now()}`;

    // 1. File an "Others" request.
    const fileRes = await request.post('/api/health/service-requests', {
        headers: bearer(token),
        data: {
            category: 'home-care',
            title,
            details: 'E2E: nurse for post-surgery home care, three days.',
            location: 'Accra',
        },
    });
    expect(fileRes.status(), `file request -> ${fileRes.status()}`).toBe(201);
    const created = (await fileRes.json()).data as { id: string; status: string };
    expect(created.status).toBe('open');

    // 2. It appears in the patient's own list.
    const mine = await (await request.get('/api/health/service-requests/mine', { headers: bearer(token) })).json();
    const mineIds = ((mine.data ?? []) as Array<{ id: string }>).map((r) => r.id);
    expect(mineIds, 'own request is listed').toContain(created.id);

    // 3. Admin triages it: contact with a note, then schedule.
    const superToken = await apiLogin(request, SUPER);
    const note = 'E2E: called patient, Friday confirmed.';
    const contactRes = await request.put(`/api/admin/healthcare/service-requests/${created.id}`, {
        headers: bearer(superToken),
        data: { action: 'contact', admin_note: note },
    });
    expect(contactRes.ok(), `contact -> ${contactRes.status()}`).toBeTruthy();
    const schedRes = await request.put(`/api/admin/healthcare/service-requests/${created.id}`, {
        headers: bearer(superToken),
        data: { action: 'schedule' },
    });
    expect((await schedRes.json()).data.status).toBe('scheduled');

    // 4. Browser: the Others page shows the request with the team note.
    await webLogin(page, CUSTOMER, '/healthcare/bookings/others');
    await page.goto('/healthcare/bookings/others');
    await expect(page.getByRole('heading', { name: /Custom Requests/ }).first()).toBeVisible();
    await expect(page.getByText(title).first()).toBeVisible();
    await expect(page.getByText(/Friday confirmed/).first()).toBeVisible();
});

test('profession filter: virtual and doctors pages filter by profession', async ({
    page,
    request,
}) => {
    // API: virtual filter only returns professionals offering virtual consults.
    const virtual = await (await request.get('/api/doctors?virtual=true&per_page=100')).json();
    const vrows = (virtual.data ?? []) as Array<{ virtual_fee?: number | string | null }>;
    expect(vrows.length).toBeGreaterThan(0);
    for (const row of vrows) {
        expect(Number(row.virtual_fee) > 0, 'virtual filter honored').toBeTruthy();
    }

    // API: profession filter isolates a profession.
    const nurses = await (await request.get('/api/doctors?profession=nurse&per_page=100')).json();
    const nrows = (nurses.data ?? []) as Array<{ profession?: string }>;
    expect(nrows.length).toBeGreaterThan(0);
    for (const row of nrows) {
        expect(row.profession).toBe('nurse');
    }

    // Browser: virtual page offers profession chips.
    await webLogin(page, CUSTOMER, '/healthcare/virtual');
    await page.goto('/healthcare/virtual');
    await expect(page.getByRole('button', { name: 'Nurse', exact: true }).first()).toBeVisible();
});

test('admin console: healthcare requests, content and prescriptions tabs', async ({
    page,
    request,
}) => {
    const customerToken = await apiLogin(request, CUSTOMER);
    const title = `E2E AdminReq ${Date.now()}`;
    const fileRes = await request.post('/api/health/service-requests', {
        headers: bearer(customerToken),
        data: { category: 'general', title, details: 'E2E admin tab probe.' },
    });
    expect(fileRes.status()).toBe(201);

    await webLogin(page, SUPER, '/admin/dashboard');
    await expect(page.locator('#login-email')).toHaveCount(0);
    await page.goto('/admin/healthcare/doctors');

    // Requests tab triages the queue.
    await page.getByRole('button', { name: 'Requests', exact: true }).click();
    await expect(page.getByText(title).first()).toBeVisible();
    await page.getByRole('button', { name: 'Review', exact: true }).first().click();
    await page.getByPlaceholder('Note for patient (optional)').fill('E2E admin note.');
    await page.getByTitle('Confirm').click();
    await expect(page.getByText('E2E admin note.').first()).toBeVisible();

    // Content tab publishes and unpublishes library items.
    await page.getByRole('button', { name: 'Content', exact: true }).click();
    await expect(page.getByRole('button', { name: 'New Content', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'New Content', exact: true }).click();
    const guideTitle = `E2E Guide ${Date.now()}`;
    await page.getByLabel(/Title/).fill(guideTitle);
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect(page.getByText(guideTitle).first()).toBeVisible();
    const row = page.locator('tr', { hasText: guideTitle }).first();
    await row.getByRole('button', { name: 'Unpublish', exact: true }).click();
    await expect(row.getByText('Hidden')).toBeVisible();

    // Prescriptions tab serves the oversight list.
    await page.getByRole('button', { name: 'Prescriptions', exact: true }).click();
    await expect(page.getByText('RX-LIFECYCLE-ACTIVE').first()).toBeVisible();

    // Healthcare_admin reaches the same oversight endpoint (matrix alignment).
    const nurseToken = await apiLogin(request, { email: 'healthcare@everythingneed.com', passwords: ['Password1'] });
    const probe = await request.get('/api/admin/pharmacy/prescriptions', { headers: bearer(nurseToken) });
    expect(probe.status(), 'healthcare_admin reads prescriptions oversight').toBe(200);
});
