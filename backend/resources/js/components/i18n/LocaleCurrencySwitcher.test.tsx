import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocaleCurrencySwitcher from '@/components/i18n/LocaleCurrencySwitcher';

const setLanguage = vi.fn();
const setCurrency = vi.fn();

vi.mock('@/lib/use-language', () => ({
    useLanguage: () => ({
        language: 'en',
        setLanguage,
        availableLocales: [
            { code: 'en', name: 'English', native: 'English', dir: 'ltr', intl: 'en-US', flag: '🇬🇧' },
            { code: 'fr', name: 'French', native: 'Français', dir: 'ltr', intl: 'fr-FR', flag: '🇫🇷' },
            { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl', intl: 'ar', flag: '🇸🇦' },
        ],
        t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    }),
}));

vi.mock('@/lib/currency-context', () => ({
    useCurrency: () => ({ currency: 'USD', setCurrency }),
}));

describe('LocaleCurrencySwitcher', () => {
    it('shows the active language and currency combination', () => {
        render(<LocaleCurrencySwitcher />);

        expect(screen.getByRole('button').textContent).toContain('English-USD');
    });

    it('lists every language and currency in one popover', async () => {
        const user = userEvent.setup();
        render(<LocaleCurrencySwitcher />);

        await user.click(screen.getByRole('button'));

        const items = screen.getAllByRole('menuitemradio');

        // 3 languages + 9 currencies.
        expect(items).toHaveLength(12);
        expect(screen.getByRole('menuitemradio', { name: /Français/ })).toBeInTheDocument();
        expect(screen.getByRole('menuitemradio', { name: /EUR/ })).toBeInTheDocument();
        expect(screen.getByText('Language')).toBeInTheDocument();
        expect(screen.getByText('Currency')).toBeInTheDocument();
    });

    it('applies the picked language and currency', async () => {
        const user = userEvent.setup();
        render(<LocaleCurrencySwitcher />);

        await user.click(screen.getByRole('button'));
        await user.click(screen.getByRole('menuitemradio', { name: /Français/ }));
        expect(setLanguage).toHaveBeenCalledWith('fr');

        await user.click(screen.getByRole('button'));
        await user.click(screen.getByRole('menuitemradio', { name: /EUR/ }));
        expect(setCurrency).toHaveBeenCalledWith('EUR');
    });
});
