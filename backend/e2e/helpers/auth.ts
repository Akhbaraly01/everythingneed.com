import { APIRequestContext, Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Shared e2e sign-in helpers.
 *
 * Every login attempt counts against the real product throttle
 * (`POST /api/auth/login` and `POST /login` are both `throttle:10,1`), and
 * the suite performs far more than ten logins per minute once every spec
 * logs in per test. These helpers cache what a successful sign-in produced
 * - an API bearer token and a browser storage state - so each account
 * logs in once per Playwright worker and later tests reuse the session.
 * A stale cookie cache falls back to the real form flow.
 */

export interface LoginCreds {
    email: string;
    password?: string;
    passwords?: string[];
}

function passwordsFor(creds: LoginCreds): string[] {
    if (creds.passwords && creds.passwords.length > 0) return creds.passwords;
    return creds.password ? [creds.password] : [];
}

const tokenCache = new Map<string, string>();

const stateDir = path.join(os.tmpdir(), 'everythingneed-e2e-auth');

function stateFile(email: string): string {
    return path.join(stateDir, `${email.replace(/[^a-z0-9]+/gi, '_')}.json`);
}

/** Cached API sign-in: one real login per account per worker. */
export async function apiLogin(request: APIRequestContext, creds: LoginCreds): Promise<string> {
    const cached = tokenCache.get(creds.email);
    if (cached) return cached;

    let last = 0;
    for (const password of passwordsFor(creds)) {
        const res = await request.post('/api/auth/login', {
            data: { email: creds.email, password },
            // Full-suite runs saturate the single-worker dev server for
            // stretches; a 20s cap turned that into a false login failure.
            timeout: 45_000,
        });
        last = res.status();
        if (res.ok()) {
            const body = await res.json();
            const token = body.data.access_token as string;
            tokenCache.set(creds.email, token);
            return token;
        }
    }
    throw new Error(`API login failed for ${creds.email} (last status ${last})`);
}

function readState(email: string): { cookies: Array<Record<string, unknown>> } | null {
    const file = stateFile(email);
    try {
        if (!fs.existsSync(file)) return null;
        return JSON.parse(fs.readFileSync(file, 'utf8')) as { cookies: Array<Record<string, unknown>> };
    } catch {
        return null;
    }
}

function writeState(email: string, state: unknown): void {
    try {
        fs.mkdirSync(stateDir, { recursive: true });
        fs.writeFileSync(stateFile(email), JSON.stringify(state));
    } catch {
        // A cache write failure only costs a later real login.
    }
}

/**
 * Browser sign-in. `landing` is where the cached-cookie shortcut navigates
 * (the server-side role landing for that account); the real form flow keeps
 * the application's own redirect, exactly as a human would experience it.
 */
export async function webLogin(page: Page, creds: LoginCreds, landing = '/dashboard'): Promise<void> {
    const cached = readState(creds.email);
    if (cached && cached.cookies.length > 0) {
        await page.context().addCookies(cached.cookies);
        // Validate the cached session against an auth-required route.
        // Public landings (/healthcare, /healthcare/labs) render fine with a
        // dead session, so a landing-only check would sign us out silently
        // and the next auth-only page would bounce to /login. /dashboard
        // sits in the auth+verified group: 200 = live session, 302 = stale.
        const probe = await page.request.get('/dashboard', { maxRedirects: 0 });
        if (probe.status() === 200) {
            await page.goto(landing, { waitUntil: 'domcontentloaded' });
            if (!page.url().includes('/login')) return;
        }
    }

    // One context can sign in as several accounts across a chain (customer
    // browsing, then an admin console), and /login bounces already-signed-in
    // users to their landing - the form fields would never render. Drop any
    // leftover session so the real form flow always starts as a guest.
    await page.context().clearCookies();

    await page.goto('/login');
    await page.locator('#login-email').fill(creds.email);
    await page.locator('#login-password').fill(passwordsFor(creds)[0]);
    // The tab bar also has a "Sign In" button - target the form submit only.
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });

    writeState(creds.email, await page.context().storageState());
}
