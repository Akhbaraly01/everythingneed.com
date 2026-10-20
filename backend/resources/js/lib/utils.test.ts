import { describe, expect, it } from 'vitest';
import {
    activeIntlLocale,
    cn,
    formatCurrency,
    formatDate,
    formatDateTime,
    getInitials,
    slugify,
    truncate,
} from '@/lib/utils';

describe('cn', () => {
    it('merges conflicting tailwind classes (last wins)', () => {
        expect(cn('p-2', 'p-4')).toBe('p-4');
        const danger = false;
        expect(cn('text-red-500', danger && 'text-blue-500', 'text-sm')).toBe(
            'text-red-500 text-sm'
        );
    });
});

describe('formatters', () => {
    it('formats money via Intl', () => {
        expect(formatCurrency(19.99)).toBe('$19.99');
        expect(formatCurrency(10, 'EUR')).toBe('€10.00');
    });

    it('formats stable dates independent of local timezone', () => {
        const noonUtc = new Date(Date.UTC(2026, 0, 15, 12));
        expect(formatDate(noonUtc)).toBe('January 15, 2026');
        expect(formatDateTime(noonUtc)).toContain('Jan 15, 2026');
    });

    it('defaults Intl formatting to en before the i18n boot runs', () => {
        expect(activeIntlLocale()).toBe('en');
        expect(formatDate(new Date(Date.UTC(2026, 0, 15, 12)))).not.toMatch(/[٠-٩]/);
    });
});

describe('text helpers', () => {
    it('truncates with an ellipsis only past the limit', () => {
        expect(truncate('hello', 10)).toBe('hello');
        expect(truncate('hello world', 5)).toBe('hello...');
    });

    it('slugifies titles for URLs', () => {
        expect(slugify('Hello World')).toBe('hello-world');
        expect(slugify('Wireless Earbuds & More!')).toBe('wireless-earbuds-more');
    });

    it('derives avatar initials', () => {
        expect(getInitials('Ada Lovelace')).toBe('AL');
        expect(getInitials('ada')).toBe('A');
        // Two characters max even for long names.
        expect(getInitials('Grace Brewster Murray Hopper')).toBe('GB');
    });
});
