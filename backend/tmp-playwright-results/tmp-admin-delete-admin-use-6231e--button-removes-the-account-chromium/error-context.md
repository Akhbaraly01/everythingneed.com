# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tmp-admin-delete.spec.ts >> admin user delete button removes the account
- Location: e2e\tmp-admin-delete.spec.ts:6:1

# Error details

```
TimeoutError: apiRequestContext.post: Timeout 45000ms exceeded.
Call log:
  - → POST http://127.0.0.1:8000/api/auth/login
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 58
    - cookie: XSRF-TOKEN=eyJpdiI6Ii9JZlJ6VTlRN0N6Y0hzS3kiLCJ2YWx1ZSI6IllSMUd5YjQwenRNZVU3WkFuaS9zV25IMFNRMm1xYk8xNUM0TlkvOEp6bTVQTjhKNXhWblZYcXMvcmtoTXZoamZjVUVCZkNPZVR2MmNtTnRpcytmREErUDlmTFpJK0gycTduY0JobzQzTnFJLyIsIm1hYyI6IiIsInRhZyI6Im81enArbEEyYVBubnNCbC9QTmJXOGc9PSJ9; everythingneed_session=eyJpdiI6Ims3QXhvZjFudS9KSDh1NHUiLCJ2YWx1ZSI6InlGV3JlMTRtRTd4RkQ5ZDZ6c1dCclRqZXpYTWJEcUpaS1pYcUVhR1lYeVp4NDlNZ24zOXVjN2ZSaEhJR1k4MW5iVjExRkdsZTRJNEpCRzVGb1ozUlAvSDROdVVtc0VUdHRHeXU1ZTllNnJQVCIsIm1hYyI6IiIsInRhZyI6ImdnV2NKNEVwV1Q5Y2V0V21JZ0pXeEE9PSJ9

```

# Test source

```ts
  1   | import { APIRequestContext, Page } from '@playwright/test';
  2   | import fs from 'node:fs';
  3   | import os from 'node:os';
  4   | import path from 'node:path';
  5   | 
  6   | /**
  7   |  * Shared e2e sign-in helpers.
  8   |  *
  9   |  * Every login attempt counts against the real product throttle
  10  |  * (`POST /api/auth/login` and `POST /login` are both `throttle:10,1`), and
  11  |  * the suite performs far more than ten logins per minute once every spec
  12  |  * logs in per test. These helpers cache what a successful sign-in produced
  13  |  * - an API bearer token and a browser storage state - so each account
  14  |  * logs in once per Playwright worker and later tests reuse the session.
  15  |  * A stale cookie cache falls back to the real form flow.
  16  |  */
  17  | 
  18  | export interface LoginCreds {
  19  |     email: string;
  20  |     password?: string;
  21  |     passwords?: string[];
  22  | }
  23  | 
  24  | function passwordsFor(creds: LoginCreds): string[] {
  25  |     if (creds.passwords && creds.passwords.length > 0) return creds.passwords;
  26  |     return creds.password ? [creds.password] : [];
  27  | }
  28  | 
  29  | const tokenCache = new Map<string, string>();
  30  | 
  31  | const stateDir = path.join(os.tmpdir(), 'everythingneed-e2e-auth');
  32  | 
  33  | function stateFile(email: string): string {
  34  |     return path.join(stateDir, `${email.replace(/[^a-z0-9]+/gi, '_')}.json`);
  35  | }
  36  | 
  37  | /** Cached API sign-in: one real login per account per worker. */
  38  | export async function apiLogin(request: APIRequestContext, creds: LoginCreds): Promise<string> {
  39  |     const cached = tokenCache.get(creds.email);
  40  |     if (cached) return cached;
  41  | 
  42  |     let last = 0;
  43  |     for (const password of passwordsFor(creds)) {
> 44  |         const res = await request.post('/api/auth/login', {
      |                                   ^ TimeoutError: apiRequestContext.post: Timeout 45000ms exceeded.
  45  |             data: { email: creds.email, password },
  46  |             // Full-suite runs saturate the single-worker dev server for
  47  |             // stretches; a 20s cap turned that into a false login failure.
  48  |             timeout: 45_000,
  49  |         });
  50  |         last = res.status();
  51  |         if (res.ok()) {
  52  |             const body = await res.json();
  53  |             const token = body.data.access_token as string;
  54  |             tokenCache.set(creds.email, token);
  55  |             return token;
  56  |         }
  57  |     }
  58  |     throw new Error(`API login failed for ${creds.email} (last status ${last})`);
  59  | }
  60  | 
  61  | function readState(email: string): { cookies: Array<Record<string, unknown>> } | null {
  62  |     const file = stateFile(email);
  63  |     try {
  64  |         if (!fs.existsSync(file)) return null;
  65  |         return JSON.parse(fs.readFileSync(file, 'utf8')) as { cookies: Array<Record<string, unknown>> };
  66  |     } catch {
  67  |         return null;
  68  |     }
  69  | }
  70  | 
  71  | function writeState(email: string, state: unknown): void {
  72  |     try {
  73  |         fs.mkdirSync(stateDir, { recursive: true });
  74  |         fs.writeFileSync(stateFile(email), JSON.stringify(state));
  75  |     } catch {
  76  |         // A cache write failure only costs a later real login.
  77  |     }
  78  | }
  79  | 
  80  | /**
  81  |  * Browser sign-in. `landing` is where the cached-cookie shortcut navigates
  82  |  * (the server-side role landing for that account); the real form flow keeps
  83  |  * the application's own redirect, exactly as a human would experience it.
  84  |  */
  85  | export async function webLogin(page: Page, creds: LoginCreds, landing = '/dashboard'): Promise<void> {
  86  |     const cached = readState(creds.email);
  87  |     if (cached && cached.cookies.length > 0) {
  88  |         await page.context().addCookies(cached.cookies);
  89  |         // Validate the cached session against an auth-required route.
  90  |         // Public landings (/healthcare, /healthcare/labs) render fine with a
  91  |         // dead session, so a landing-only check would sign us out silently
  92  |         // and the next auth-only page would bounce to /login. /dashboard
  93  |         // sits in the auth+verified group: 200 = live session, 302 = stale.
  94  |         const probe = await page.request.get('/dashboard', { maxRedirects: 0 });
  95  |         if (probe.status() === 200) {
  96  |             await page.goto(landing, { waitUntil: 'domcontentloaded' });
  97  |             if (!page.url().includes('/login')) return;
  98  |         }
  99  |     }
  100 | 
  101 |     // One context can sign in as several accounts across a chain (customer
  102 |     // browsing, then an admin console), and /login bounces already-signed-in
  103 |     // users to their landing - the form fields would never render. Drop any
  104 |     // leftover session so the real form flow always starts as a guest.
  105 |     await page.context().clearCookies();
  106 | 
  107 |     await page.goto('/login');
  108 |     await page.locator('#login-email').fill(creds.email);
  109 |     await page.locator('#login-password').fill(passwordsFor(creds)[0]);
  110 |     // The tab bar also has a "Sign In" button - target the form submit only.
  111 |     await page.locator('form button[type="submit"]').click();
  112 |     await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
  113 | 
  114 |     writeState(creds.email, await page.context().storageState());
  115 | }
  116 | 
```