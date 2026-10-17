import { createContext, useContext } from 'react';

/**
 * Promise-based confirmation context (FrontendPolicy: no native dialogs).
 * The provider component lives in components/shared/ConfirmProvider.tsx.
 */

export type ConfirmOptions = {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
};

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return ctx;
}
