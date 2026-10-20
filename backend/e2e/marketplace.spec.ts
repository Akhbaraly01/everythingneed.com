import { test, expect } from '@playwright/test';

/**
 * Wave S (§96) — public marketplace journeys on desktop AND mobile:
 * every major route loads with real data, forms validate, empty states
 * render, and failure states never strand the visitor.
 */

test('guest loads home with real sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-section-categories')).toBeVisible();
    await expect(page.getByTestId('home-section-experts')).toBeVisible();
});

test('home interleaves product batches between sections, banners precede recently viewed', async ({
    page,
}) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Interleaved backbone: batch → Featured + See all → batch → Deals.
    await expect(page.getByTestId('home-feed-batch-0')).toBeVisible();
    await expect(page.getByTestId('home-section-featured')).toBeVisible();
    await expect(page.getByTestId('home-section-deals')).toBeVisible();
    // Banners render above a highly visible Recently Viewed with See all.
    await expect(page.getByTestId('home-banners')).toBeVisible();
    await expect(page.getByTestId('home-section-recently-viewed')).toBeVisible();
    await expect(page.getByTestId('home-section-recently-viewed').getByText('See all >')).toBeVisible();
    // DOM order: banners → recently viewed.
    const bannersY = await page.getByTestId('home-banners').evaluate((el) => el.getBoundingClientRect().top);
    const rvY = await page
        .getByTestId('home-section-recently-viewed')
        .evaluate((el) => el.getBoundingClientRect().top);
    expect(rvY).toBeGreaterThan(bannersY);
});

test('home top order: banners, icons, need carousel, need banner, pills, feed', async ({
    page,
}) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-feed-batch-0')).toBeVisible({ timeout: 30_000 });

    const yOf = (testId: string) =>
        page.getByTestId(testId).first().evaluate((el) => el.getBoundingClientRect().top);
    const bannersY = await yOf('home-banners');
    const iconsY = await page.getByTestId('home-section-categories').evaluate((el) => el.getBoundingClientRect().top);
    const carousels = page.getByTestId('home-need-carousel');
    await expect(carousels).toHaveCount(2);
    const carouselY = await carousels.first().evaluate((el) => el.getBoundingClientRect().top);
    const needY = await page.getByTestId('home-section-submit-need').evaluate((el) => el.getBoundingClientRect().top);
    const pillsY = await yOf('home-search-tabs');
    const feedY = await yOf('home-feed-batch-0');

    expect(bannersY).toBeLessThan(iconsY);
    expect(iconsY).toBeLessThan(carouselY);
    expect(carouselY).toBeLessThan(needY);
    expect(needY).toBeLessThan(pillsY);
    expect(pillsY).toBeLessThan(feedY);

    // No duplicate in-page search (the fixed header owns search).
    await expect(page.getByPlaceholder('Search products, needs, courses...')).toHaveCount(0);
});

test('trending items sit above experts; experts slide with dots', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-feed-batch-0')).toBeVisible({ timeout: 30_000 });

    const trending = page.getByText('Trending Items').first();
    await expect(trending).toBeVisible();
    const trendingY = await trending.evaluate((el) => el.getBoundingClientRect().top);
    const expertsY = await page.getByTestId('home-section-experts').evaluate((el) => el.getBoundingClientRect().top);
    expect(trendingY).toBeLessThan(expertsY);

    const track = page.getByTestId('experts-track');
    await expect(track).toBeVisible();
    const dots = page.getByRole('button', { name: /Show experts page/ });
    expect(await dots.count()).toBeGreaterThan(0);
    await dots.last().click();
    await expect(track).toBeVisible();
});

test('icon row shows 8 tiles (4+4 with SeeMore) above the feed', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const grid = page.getByTestId('home-section-categories');
    await expect(grid).toBeVisible();
    // Seven category links + the SeeMore tile that reveals the rest.
    await expect(grid.getByRole('link')).toHaveCount(7);
    await expect(grid.getByRole('button', { name: /More|Less/ })).toBeVisible();
    // Row sits above the product feed.
    const gridY = await grid.evaluate((el) => el.getBoundingClientRect().top);
    const feedY = await page.getByTestId('home-feed-batch-0').evaluate((el) => el.getBoundingClientRect().top);
    expect(gridY).toBeLessThan(feedY);
    // SeeMore expands the remaining service icons.
    await grid.getByRole('button', { name: /More|Less/ }).click();
    await expect(grid.getByRole('heading', { name: 'All Categories' })).toBeVisible();
});

test('language switch translates chrome globally', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-feed-batch-0')).toBeVisible({ timeout: 30_000 });

    await expect(page.getByPlaceholder('Search everything...')).toBeVisible();
    await expect(page.getByText('Featured Products').first()).toBeVisible();

    await page.getByLabel('Language').click();
    // The switcher is an ARIA menu: the options are menuitemradio, not buttons.
    await page.getByRole('menuitemradio', { name: 'Español' }).click();

    await expect(page.getByPlaceholder('Buscar todo...')).toBeVisible();
    await expect(page.getByText('Productos destacados').first()).toBeVisible();
    await expect(page.getByText('Ver todo >').first()).toBeVisible();
    await expect.poll(async () => page.evaluate(() => document.documentElement.lang)).toBe('es');
});

test('refresh lands on top of the page from anywhere', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // domcontentloaded fires before React hydrates — wait for real content
    // or the scroll target is an empty document and never moves.
    await expect(page.getByTestId('home-feed-batch-0')).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => window.scrollY > 0);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBe(0);
});

test('header and bottom nav stay fixed while scrolling', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-feed-batch-0')).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => window.scrollY > 0);
    // Computed position never leaves fixed, header stays visible mid-scroll.
    const headerPos = await page.getByTestId('site-header').evaluate((el) => getComputedStyle(el).position);
    expect(headerPos).toBe('fixed');
    await expect(page.getByTestId('site-header')).toBeVisible();
    const dockPos = await page.getByTestId('site-nav-mobile').evaluate((el) => getComputedStyle(el).position);
    expect(dockPos).toBe('fixed');
    // Header icons stay clickable after scrolling.
    await expect(page.getByTestId('site-header').getByRole('link').first()).toBeVisible();
});

test('recently viewed page renders and links back home', async ({ page }) => {
    await page.goto('/recently-viewed', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Recently Viewed' })).toBeVisible();
    await expect(page.getByText('Back home')).toBeVisible();
});

test('guest browses products and gets an empty search state', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder('Search products...')).toBeVisible();
    // Seeded catalogue renders real rows with cart actions.
    await expect(page.getByTitle('Add to cart').first()).toBeVisible();

    await page.goto('/search?q=zzzznomatchxyz', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('No results found')).toBeVisible();
});

test('guest opens the vertical listings', async ({ page }) => {
    const targets = [
        { path: '/food', heading: 'Restaurants' },
        { path: '/hotels', heading: 'Hotels' },
    ] as const;
    for (const target of targets) {
        await page.goto(target.path, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: target.heading }).first()).toBeVisible();
    }

    await page.goto('/learn', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Learn New Skills/ })).toBeVisible();
});

test('register surfaces the taken-email failure without creating anything', async ({
    page,
}) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.locator('#name').fill('E2E Probe');
    await page.locator('#email').fill('user@everythingneed.com');
    await page.locator('#password').fill('Password1!');
    await page.locator('#password_confirmation').fill('Password1!');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form p.text-red-600').first()).toBeVisible();
    // Failure state: still on the form, never logged in.
    await expect(page).toHaveURL(/register/);
    await expect(page.locator('#name')).toHaveValue('E2E Probe');
});

test('login requires credentials before redirecting', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form p.text-destructive').first()).toBeVisible();
    await expect(page).toHaveURL(/login/);
});
