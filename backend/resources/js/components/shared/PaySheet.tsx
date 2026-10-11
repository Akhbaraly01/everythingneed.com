import { api, errorMessage } from '@/lib/api';
import { CARD_FALLBACK, listPaymentMethods, PaymentMethodOption } from '@/lib/payments';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { CreditCard, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PaySheetProps {
    /** Booking-specific pay endpoint (amount is derived server-side). */
    endpoint: string;
    /** Display only - the server never trusts this value. */
    amount?: number | null;
    title?: string;
    onPaid: () => void;
}

/**
 * Payment step shared by booking flows (spec 97: Book -> Pay).
 * The endpoint receives only { method }; fees and idempotency keys
 * are derived server-side from the booking row.
 */
export default function PaySheet({ endpoint, amount, title = 'Complete payment', onPaid }: PaySheetProps) {
    const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
    const [method, setMethod] = useState('card');
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        listPaymentMethods()
            .then((m) => setMethods(m.length ? m : [CARD_FALLBACK]))
            .catch(() => setMethods([CARD_FALLBACK]))
            .finally(() => setLoading(false));
    }, []);

    const pay = async () => {
        setPaying(true);
        try {
            await api.post(endpoint, { method });
            toast.success('Payment confirmed');
            onPaid();
        } catch (e) {
            toast.error(errorMessage(e, 'Payment failed'));
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {amount != null && (
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(amount)}</p>
            )}

            <div className="mt-4 space-y-2">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading payment methods...</p>
                ) : (
                    methods.map((m) => (
                        <label
                            key={m.id}
                            className={`flex items-center justify-between rounded-lg border p-3 ${
                                method === m.id
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                            } ${m.enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                        >
                            <span className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    name="pay-method"
                                    value={m.id}
                                    checked={method === m.id}
                                    disabled={!m.enabled}
                                    onChange={() => setMethod(m.id)}
                                    className="text-indigo-600"
                                />
                                {m.id === 'wallet' ? (
                                    <Wallet className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <CreditCard className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{m.label}</span>
                            </span>
                            {m.id === 'wallet' && m.available != null && (
                                <span className="text-xs text-gray-500">Balance {formatPrice(m.available)}</span>
                            )}
                        </label>
                    ))
                )}
            </div>

            <button
                onClick={pay}
                disabled={paying || loading}
                className="mt-4 w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
                {paying ? 'Processing...' : amount != null ? `Pay ${formatPrice(amount)}` : 'Pay'}
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
                Sandbox mode - no real funds are charged on this environment.
            </p>
        </div>
    );
}
