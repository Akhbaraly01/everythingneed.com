import { defineConfig, devices } from '@playwright/test';

/**
 * Browser E2E for the Laravel Inertia app.
 *
 * Runs against built assets served by `php artisan serve` on 127.0.0.1:8000.
 * Reuses an already-running server (local dev); starts one only when nothing
 * answers the probe (CI). Override with E2E_BASE_URL.
 *
 * Chromium only - firefox/webkit binaries are not installed on this box and
 * add no coverage Inertia page tests don't already provide.
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    // JSON report feeds scripts/check-e2e-results.mjs (min-tests gate in CI).
    reporter: [
        ['list'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'playwright-report/results.json' }],
    ],
    // 90s (was 60s): full-suite runs saturate the single-worker dev server
    // and slow teardowns previously burned the whole budget.
    timeout: 90_000,
    // Wave S: the single-threaded dev server answers slowly under the
    // multi-fetch console pages - 20s assertions, retries stay CI-only.
    // L-H (was 20s): the global locale/session middleware adds per-request
    // DB work; Inertia navigations occasionally exceed 20s under load.
    expect: { timeout: 30_000 },
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:8000',
        actionTimeout: 20_000,
        navigationTimeout: 45_000,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        // Wave S (§96): every public journey is verified on a mobile
        // viewport too. Admin console specs opt out explicitly (desktop-only).
        { name: 'mobile', use: { ...devices['Pixel 5'] } },
        // W17 (F-01): tablet viewport coverage for the public journeys;
        // admin/console specs opt out to desktop-only via testInfo skip.
        { name: 'tablet', use: { browserName: 'chromium', viewport: { width: 834, height: 1112 }, hasTouch: true, isMobile: false } },
    ],
    webServer: {
        command: 'php artisan serve --port=8000',
        url: 'http://127.0.0.1:8000/login',
        reuseExistingServer: !process.env.CI,
    // 90s (was 60s): full-suite runs saturate the single-worker dev server
    // and teardown of a slow test previously burned the whole budget.
    timeout: 90_000,
    },
});
