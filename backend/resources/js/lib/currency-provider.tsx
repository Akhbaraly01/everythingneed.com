import { useCallback, useMemo, useState } from 'react';
import {
    activeCurrency,
    isDisplayCurrency,
    normalizeCurrency,
    persistCurrency,
    type DisplayCurrency,
} from '@/lib/currency';
import { CurrencyContext, type CurrencyContextValue } from '@/lib/currency-context';

/**
 * Display-currency provider.
 *
 * The money layer stores USD-major amounts and only converts them for
 * display (lib/currency.ts). This provider owns the *active* display
 * currency so the whole tree re-renders when it changes - every price
 * component calls formatPrice(), which reads the persisted value.
 *
 * Persistence:
 *   - always: localStorage (guests + fast boot for signed-in users)
 *   - signed-in: the account preference (general.currency) so the choice
 *     follows the shopper to another device.
 */
export function CurrencyProvider({
    initialCurrency,
    userId,
    children,
}: {
    /** Account preference (server) for signed-in users. */
    initialCurrency?: unknown;
    /** Signed-in user id; enables account persistence. */
    userId?: number | string | null;
    children: React.ReactNode;
}) {
    const [currency, setCurrencyState] = useState<DisplayCurrency>(() => {
        // The account preference wins for signed-in users; guests fall
        // back to the stored choice.
        if (isDisplayCurrency(initialCurrency)) {
            const resolved = normalizeCurrency(initialCurrency);

            persistCurrency(resolved);

            return resolved;
        }

        return activeCurrency();
    });

    const setCurrency = useCallback(
        (value: unknown) => {
            const resolved = normalizeCurrency(value);

            setCurrencyState(resolved);
            persistCurrency(resolved);

            if (userId === null || userId === undefined || userId === '') {
                return;
            }

            // Account preference (best effort; the local choice stands
            // if the request fails).
            void (async () => {
                try {
                    const token =
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') ?? '';

                    await fetch(`/api/users/${userId}/settings`, {
                        method: 'PUT',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-CSRF-TOKEN': token,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: JSON.stringify({
                            settings: [{ key: 'general.currency', value: resolved }],
                        }),
                    });
                } catch {
                    // Offline / unauthenticated: the local choice stands.
                }
            })();
        },
        [userId],
    );

    const value = useMemo<CurrencyContextValue>(
        () => ({ currency, setCurrency }),
        [currency, setCurrency],
    );

    return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
