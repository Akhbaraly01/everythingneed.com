import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getCurrentLocale, intlFor } from '@/lib/i18n-config';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * BCP 47 tag of the active chrome locale for Intl formatting
 * (multilingual Phase 0: dates/numbers/currency follow the selected
 * language; falls back to en before the i18n boot runs).
 */
export function activeIntlLocale(): string {
    try {
        return intlFor(getCurrentLocale());
    } catch {
        return 'en';
    }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat(activeIntlLocale(), {
        style: 'currency',
        currency,
    }).format(amount);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat(activeIntlLocale(), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat(activeIntlLocale(), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
