/**
 * Display-currency layer (spec phase 10).
 *
 * Stored financial amounts are always USD-major units and are NEVER mutated
 * here - this module only formats what the shopper sees. The active display
 * currency comes from the account preferences (Settings -> General, shared
 * `preferences` page prop) with a localStorage fallback for guests.
 *
 * Conversion uses a static indicative rate table (RATES_AS_OF). Live rates
 * would require a licensed feed; the table is deliberately explicit and
 * documented instead of pretending to be live.
 */

import { getCurrentLocale, intlFor } from '@/lib/i18n-config';

export const DISPLAY_CURRENCIES = [
    'USD',
    'EUR',
    'GBP',
    'GHS',
    'KES',
    'NGN',
    'ZAR',
    'INR',
    'AED',
] as const;

export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export const DEFAULT_CURRENCY: DisplayCurrency = 'USD';

/** Indicative USD-pegged rates (1 USD = rate units). Updated 2026-10-05. */
export const RATES_AS_OF = '2026-10-05';

const RATES: Record<DisplayCurrency, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    GHS: 15.4,
    KES: 129.0,
    NGN: 1550.0,
    ZAR: 18.2,
    INR: 83.7,
    AED: 3.67,
};

const STORAGE_KEY = 'everythingneed-currency';

export function isDisplayCurrency(value: unknown): value is DisplayCurrency {
    return (
        typeof value === 'string' &&
        (DISPLAY_CURRENCIES as readonly string[]).includes(value.toUpperCase())
    );
}

export function normalizeCurrency(value: unknown): DisplayCurrency {
    if (isDisplayCurrency(value)) {
        return value.toUpperCase() as DisplayCurrency;
    }
    return DEFAULT_CURRENCY;
}

/** Active display currency: explicit override > localStorage > USD. */
export function activeCurrency(override?: unknown): DisplayCurrency {
    if (isDisplayCurrency(override)) {
        return override.toUpperCase() as DisplayCurrency;
    }
    try {
        return normalizeCurrency(localStorage.getItem(STORAGE_KEY));
    } catch {
        return DEFAULT_CURRENCY;
    }
}

export function persistCurrency(currency: DisplayCurrency): void {
    try {
        localStorage.setItem(STORAGE_KEY, currency);
    } catch {
        // Private-mode storage failure must not break rendering.
    }
}

/** Convert a USD-major amount to display currency units (display only). */
export function convertFromUsd(amountUsd: number, currency: DisplayCurrency): number {
    return amountUsd * (RATES[currency] ?? 1);
}

/**
 * Central price formatter (spec phase 10 `formatPrice`).
 * `amountUsd` is always the stored USD amount; rendering converts + formats
 * per the active display currency with correct symbol and decimals,
 * localized to the active chrome locale (multilingual Phase 0).
 */
export function formatPrice(amountUsd: number, currency?: unknown): string {
    const code = activeCurrency(currency);
    const converted = convertFromUsd(Number(amountUsd) || 0, code);
    return new Intl.NumberFormat(intlFor(getCurrentLocale()), {
        style: 'currency',
        currency: code,
    }).format(converted);
}
