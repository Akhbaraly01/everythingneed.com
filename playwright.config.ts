import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for E2E tests.
 * Boots the Vite dev server, runs Chromium/Firefox/WebKit tests against http://localhost:8080.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Stricter retry policy to absorb transient flakes (network idle, route hydration).
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["list"], ["html", { open: "never" }], ["json", { outputFile: "playwright-report/results.json" }]]
    : [["list"], ["html", { open: "never" }], ["json", { outputFile: "playwright-report/results.json" }]],
  // Tighter, explicit timeouts so failures surface fast with full artifacts.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:8080",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    // Always capture rich debug artifacts on failure so CI logs are actionable.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 8080 --strictPort",
        url: "http://localhost:8080",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
