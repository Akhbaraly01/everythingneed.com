import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { TableSkeleton } from '@/components/shared/Ui';
import VendorTabs from '@/components/vendor/VendorTabs';

interface ProfileData {
    vendor: {
        id: string;
        store_name: string;
        category: string;
        description?: string | null;
        is_verified: boolean;
        slug?: string;
    };
    user: { id: string; name: string; email: string };
}

export default function VendorProfile() {
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ store_name: '', category: '', description: '' });
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        api.get<{ data: ProfileData }>('/api/vendor/profile')
            .then((res) => {
                setData(res.data);
                setForm({
                    store_name: res.data.vendor.store_name,
                    category: res.data.vendor.category,
                    description: res.data.vendor.description ?? '',
                });
            })
            .catch((err) => toast.error(errorMessage(err, 'Could not load your vendor profile')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const res = await api.put<{ message: string; data: ProfileData['vendor'] }>('/api/vendor/profile', form);
            toast.success(res.message ?? 'Profile updated');
            setData((d) => (d ? { ...d, vendor: res.data } : d));
        } catch (err) {
            toast.error(errorMessage(err, 'Save failed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppLayout title="Vendor profile">
            <Head title="Vendor profile" />
            <div className="mx-auto max-w-3xl space-y-4">
                <VendorTabs />

                {loading ? (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <TableSkeleton rows={3} cols={2} />
                    </div>
                ) : !data ? (
                    <p className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow dark:bg-gray-800">
                        You need a vendor profile to manage your store. Register as a vendor first.
                    </p>
                ) : (
                    <form onSubmit={save} className="space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Store profile</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Signed in as {data.user.name} ({data.user.email})
                                {data.vendor.is_verified && <span className="ml-2 text-green-600">Verified store</span>}
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Store name</label>
                            <input
                                required
                                value={form.store_name}
                                onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                            <input
                                required
                                value={form.category}
                                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                placeholder="e.g. electronics"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm capitalize dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={busy}
                                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {busy ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
