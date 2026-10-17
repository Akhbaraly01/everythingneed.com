import { test, expect, APIRequestContext } from '@playwright/test';
import { apiLogin, webLogin } from './helpers/auth';

/**
 * N-22 gig packages + N-24 workroom (P3 browser proof).
 *
 * A vendor publishes a tiered gig through the real moderation funnel
 * (submit -> approve -> publish); a customer picks the Standard tier plus a
 * source-file extra on /deals, lands on a prefilled request form, and
 * submits; the accepted provider uploads a brief to the workroom and both
 * parties can retrieve it. Seeds are unique per run, never destructive.
 */

const CUSTOMER = { email: 'user@everythingneed.com', passwords: ['Password1', 'password'] };
const VENDOR = { email: 'vendor@everythingneed.com', passwords: ['Password1', 'password'] };
const SUPER = { email: 'super@everythingneed.com', passwords: ['password', 'Password1'] };

function bearer(token: string) {
    return { Authorization: `Bearer ${token}` };
}

interface PublishedGig {
    itemId: string;
    slug: string;
    name: string;
    categoryId: string;
}

/** Vendor lists a tiered gig; SUPER approves + publishes through the console API. */
async function publishPackageListing(request: APIRequestContext, seed: string): Promise<PublishedGig> {
    const superToken = await apiLogin(request, SUPER);
    const vendorToken = await apiLogin(request, VENDOR);

    const cat = await request.post('/api/admin/needs/categories', {
        headers: bearer(superToken),
        data: { name: `E2E gigs ${seed}`, slug: `e2e-gigs-${seed}`, is_active: true },
    });
    expect(cat.ok(), `create category -> ${cat.status()}`).toBeTruthy();
    const categoryId = (await cat.json()).data.id as string;

    const name = `E2E logo gig ${seed}`;
    const item = await request.post('/api/need-items', {
        headers: bearer(vendorToken),
        data: {
            name,
            description: 'Playwright gig package listing.',
            category_id: categoryId,
            price: 50,
            packages: [
                { name: 'Basic', price: 50, delivery_time: '3 days', description: '1 concept' },
                { name: 'Standard', price: 120, delivery_time: '2 days', description: '3 concepts' },
            ],
            add_ons: [{ name: 'Source file', price: 15 }],
            submit: true,
        },
    });
    expect(item.status(), 'submit listing').toBe(201);
    const itemId = (await item.json()).data.id as string;

    for (const action of ['approve', 'publish']) {
        const mod = await request.post(`/api/admin/needs/listings/${itemId}/moderate`, {
            headers: bearer(superToken),
            data: { action },
        });
        expect(mod.ok(), `moderate ${action} -> ${mod.status()}`).toBeTruthy();
    }

    const deal = await request.get(`/api/deals/${itemId}`);
    expect(deal.ok(), `deal visible -> ${deal.status()}`).toBeTruthy();
    const slug = (await deal.json()).data.slug as string;
    return { itemId, slug, name, categoryId };
}

test('gig package flow: pick a tier on the deal, submit the prefilled request', async ({
    page,
    request,
}) => {
    const seed = `pkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const gig = await publishPackageListing(request, seed);
    const customerToken = await apiLogin(request, CUSTOMER);

    // 1. Customer picks Standard + the source-file extra on the deal page.
    await webLogin(page, CUSTOMER);
    await page.goto(`/deals/${gig.slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('deal-packages')).toBeVisible();
    await page.getByTestId('deal-package-1').click();
    await page.getByText('Source file').click();
    await page.getByTestId('deal-request-package').click();

    // 2. The request form carries the listing banner and the server tier.
    await page.waitForURL('**/needs/request**');
    await expect(page.getByTestId('linked-listing')).toBeVisible();
    await expect(page.getByTestId('linked-listing')).toContainText(gig.name);
    await expect(page.getByTestId('linked-listing')).toContainText('Standard');
    await expect(page.locator('#need-title')).toHaveValue(gig.name);
    await expect(page.locator('#need-budget-min')).toHaveValue('120');

    // 3. Description is the only thing the prefill cannot supply.
    await page.locator('#need-description').fill('Playwright e2e gig package request.');
    await page.getByTestId('need-submit-button').click();
    await page.getByTestId('need-confirm-button').click();
    await page.waitForURL('**/needs/my-needs/**');
    const needId = page.url().split('/').pop() as string;

    // 4. The snapshot landed from the SERVER listing, tier 1 + the extra.
    const shown = await request.get(`/api/need-requests/${needId}`, {
        headers: bearer(customerToken),
    });
    expect(shown.ok(), `show need -> ${shown.status()}`).toBeTruthy();
    const body = await shown.json();
    expect(String(body.data.selected_listing_id)).toBe(gig.itemId);
    expect(body.data.selected_package.name).toBe('Standard');
    expect(Number(body.data.selected_package.price)).toBe(120);
    expect(body.data.selected_package.delivery_time).toBe('2 days');
    expect(body.data.selected_package.add_ons[0].name).toBe('Source file');
});

test('workroom flow: accepted provider uploads, both parties retrieve', async ({
    page,
    request,
}) => {
    const customerToken = await apiLogin(request, CUSTOMER);
    const vendorToken = await apiLogin(request, VENDOR);
    const title = `E2E workroom need ${Date.now()}`;
    const fileName = `brief-${Date.now()}.txt`;
    const fileBody = 'Playwright workroom brief: start with the Standard tier.';

    // 1. Plain post -> offer -> accept chain (no pay needed for the room).
    const created = await request.post('/api/need-requests', {
        headers: bearer(customerToken),
        data: { title, description: 'Playwright chain workroom request', budget_min: 120, budget_max: 135 },
    });
    expect(created.status(), 'create need').toBe(201);
    const needId = (await created.json()).data.id as string;

    const offer = await request.post(`/api/need-requests/${needId}/offers`, {
        headers: bearer(vendorToken),
        data: { price: 120, message: 'Playwright workroom offer' },
    });
    expect(offer.status(), 'submit offer').toBe(201);
    const offerId = (await offer.json()).data.id as string;

    const accept = await request.post(`/api/need-requests/${needId}/offers/${offerId}/accept`, {
        headers: bearer(customerToken),
    });
    expect(accept.ok(), `accept offer -> ${accept.status()}`).toBeTruthy();

    // 2. The accepted provider sees the room and uploads the brief.
    await webLogin(page, VENDOR);
    await page.goto(`/needs/requests/${needId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('workroom')).toBeVisible();

    const [chooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.locator('label', { hasText: 'Upload file' }).click(),
    ]);
    await chooser.setFiles({ name: fileName, mimeType: 'text/plain', buffer: Buffer.from(fileBody) });
    await expect(page.getByText(fileName)).toBeVisible();

    // 3. The Download button mints a per-download signed URL (the popup it
    // opens carries attachment bytes, so assert mint + payload instead).
    const row = page.locator('[data-testid^="workroom-file-"]', { hasText: fileName });
    await expect(row).toBeVisible();
    const fileId = ((await row.getAttribute('data-testid')) ?? '').replace('workroom-file-', '');
    expect(fileId).not.toBe('');

    const [popup, minted] = await Promise.all([
        page.waitForEvent('popup'),
        page.waitForResponse(
            (r) => r.url().includes(`/files/${fileId}/url`) && r.request().method() === 'GET',
        ),
        row.getByRole('button', { name: 'Download' }).click(),
    ]);
    expect(minted.ok(), `mint download url -> ${minted.status()}`).toBeTruthy();
    await popup.close().catch(() => undefined);

    const signedUrl = (await minted.json()).data.url as string;
    expect(signedUrl).toContain('signed-storage/stream');
    const streamed = await request.get(signedUrl, { headers: bearer(vendorToken) });
    expect(streamed.ok(), `stream workroom file -> ${streamed.status()}`).toBeTruthy();
    expect(await streamed.text()).toBe(fileBody);

    // 4. The owner sees the same file (and can remove it), the room working
    // for both parties of the accepted engagement.
    await webLogin(page, CUSTOMER);
    await page.goto(`/needs/requests/${needId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('workroom')).toBeVisible();
    await expect(page.getByText(fileName)).toBeVisible();
    await expect(
        page.locator('[data-testid^="workroom-file-"]', { hasText: fileName }).getByRole('button', { name: 'Remove' }),
    ).toBeVisible();
});
