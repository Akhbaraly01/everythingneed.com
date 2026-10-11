import { describe, expect, it } from 'vitest';
import {
    DEFAULT_CURRENCY,
    activeCurrency,
    convertFromUsd,
    formatPrice,
    isDisplayCurrency,
    normalizeCurrency,
    persistCurrency,
} from '@/lib/currency';

describe('currency guards', () => {
    it('accepts supported codes case-insensitively and rejects unknown values', () => {
        expect(isDisplayCurrency('USD')).toBe(true);
        expect(isDisplayCurrency('ngn')).toBe(true);
        expect(isDisplayCurrency('XYZ')).toBe(false);
        expect(isDisplayCurrency(42)).toBe(false);
        expect(isDisplayCurrency(null)).toBe(false);
    });

    it('normalizes anything unsupported back to the default', () => {
        expect(normalizeCurrency('eur')).toBe('EUR');
        expect(normalizeCurrency('not-a-currency')).toBe(DEFAULT_CURRENCY);
        expect(normalizeCurrency(undefined)).toBe(DEFAULT_CURRENCY);
    });
});

describe('active currency resolution', () => {
    it('prefers the explicit override, then localStorage, then USD', () => {
        expect(activeCurrency('GBP')).toBe('GBP');
        expect(activeCurrency('bad')).toBe(DEFAULT_CURRENCY);

        persistCurrency('NGN');
        expect(activeCurrency()).toBe('NGN');
        expect(activeCurrency('KES')).toBe('KES');

        localStorage.removeItem('everythingneed-currency');
        expect(activeCurrency()).toBe(DEFAULT_CURRENCY);
    });
});

describe('conversion and formatting', () => {
    it('converts USD-major amounts through the rate table', () => {
        expect(convertFromUsd(10, 'USD')).toBe(10);
        expect(convertFromUsd(10, 'NGN')).toBeCloseTo(15500);
        expect(convertFromUsd(2, 'EUR')).toBeCloseTo(1.84);
    });

    it('formats stored USD amounts into the display currency', () => {
        expect(formatPrice(19.99)).toBe('$19.99');
        expect(formatPrice(0)).toBe('$0.00');
        expect(formatPrice(10, 'NGN')).toMatch(/15,500\.00/);
        expect(formatPrice(10, 'eur')).toMatch(/9\.20/);
        // Non-numeric input degrades to zero instead of NaN in the UI.
        expect(formatPrice(Number('nope'))).toBe('$0.00');
    });
});
