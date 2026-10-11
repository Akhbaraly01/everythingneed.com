import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Store } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { TableSkeleton } from '@/components/shared/Ui';
import VendorTabs from '@/components/vendor/VendorTabs';

interface SettingsData {
    id: string;
    store_name: string;
    settings?: { accepting_orders?: boolean } | null;
}

export default function VendorSettings() {
    const [vendor, setVendor] = useState<SettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        api.get<{ data: { vendor: SettingsData } }>('/api/vendor/profile')
            .then((res) => setVendor(res.data.vendor))
            .catch((err) => toast.error(errorMessage(err, 'Could not load settings')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const toggleAccepting = async () => {
        if (!vendor) return;
        const next = !(vendor.settings?.accepting_orders ?? true);
        setBusy(true);
        try {
            const res = await api.put<{ message: string; data: SettingsData }>('/api/vendor/settings', {
                accepting_orders: next,
            });
            setVendor(res.data);
            toast.success(next ? 'Store is now accepting orders' : 'Store paused - new orders are blocked');
        } catch (err) {
            toast.error(errorMessage(err, 'Update failed'));
        } finally {
            setBusy(false);
        }
    };

    const accepting = vendor?.settings?.accepting_orders ?? true;

    return (
        <AppLayout title="Vendor settings">
            <Head title="Settings" />
            <div className="mx-auto max-w-3xl space-y-4">
                <VendorTabs />

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Settings</h1>
                    <p className="text-sm text-gray-500">Control how {vendor?.store_name ?? 'your store'} operates.</p>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <TableSkeleton rows={2} cols={2} />
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-indigo-50 p-2.5 dark:bg-indigo-950/40">
                                    <Store className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Accepting orders</h2>
                                    <p className="mt-1 max-w-md text-sm text-gray-500">
                                        When paused, customers cannot add your products to the cart and checkout skips your
                                        store. Your listings stay visible.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={toggleAccepting}
                                disabled={busy || !vendor}
                                role="switch"
                                aria-checked={accepting}
                                className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${
                                    accepting ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                                        accepting ? 'left-6' : 'left-1'
                                    }`}
                                />
                            </button>
                        </div>
                        <p className={`mt-4 text-sm font-medium ${accepting ? 'text-green-600' : 'text-amber-600'}`}>
                            {accepting ? 'Your store is live and accepting orders.' : 'Your store is paused - no new orders can be placed.'}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
