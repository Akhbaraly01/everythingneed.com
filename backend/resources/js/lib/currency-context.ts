import { createContext, useContext } from 'react';
import { activeCurrency, type DisplayCurrency } from '@/lib/currency';

/**
 * Display-currency context.
 *
 * The context lives in its own module (like the language context) so the
 * provider component and the consumer hook can live in separate files
 * without breaking fast refresh.
 */
export interface CurrencyContextValue {
    /** Active display currency (stored amounts stay USD-major). */
    currency: DisplayCurrency;
    /** Switch the display currency (persists locally and on the account). */
    setCurrency: (value: unknown) => void;
}

export const CurrencyContext = createContext<CurrencyContextValue>({
    currency: activeCurrency(),
    setCurrency: () => null,
});

export function useCurrency(): CurrencyContextValue {
    return useContext(CurrencyContext);
}
