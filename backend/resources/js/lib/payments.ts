import { api } from '@/lib/api';

export interface PaymentMethodOption {
    id: string;
    label: string;
    enabled: boolean;
    available?: number;
}

/**
 * Server-owned payment methods (spec 31): the wallet option only appears
 * for KYC-verified users, and disabled methods never render.
 */
export async function listPaymentMethods(): Promise<PaymentMethodOption[]> {
    const res = await api.get<{ data: { mode: string; methods: PaymentMethodOption[] } }>('/api/payments/methods');
    return (res.data?.methods ?? []).filter((m) => m.enabled);
}

/** Fallback when the methods endpoint cannot be reached. */
export const CARD_FALLBACK: PaymentMethodOption = { id: 'card', label: 'Card', enabled: true };
