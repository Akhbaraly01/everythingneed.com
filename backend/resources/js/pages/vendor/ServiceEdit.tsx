import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { TableSkeleton } from '@/components/shared/Ui';
import VendorTabs from '@/components/vendor/VendorTabs';

interface VendorService {
    id: string;
    name: string;
    description?: string | null;
    price: number | string;
    duration_minutes?: number | null;
    is_active: boolean;
}

export default function VendorServiceEdit({ service_id }: { service_id: string }) {
    const [service, setService] = useState<VendorService | null>(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', description: '', price: '', duration_minutes: '', is_active: true });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api.get<{ data: VendorService }>(`/api/vendor/services/${service_id}`)
            .then((res) => {
                const s = res.data;
                setService(s);
                setForm({
                    name: s.name,
                    description: s.description ?? '',
                    price: String(s.price),
                    duration_minutes: s.duration_minutes != null ? String(s.duration_minutes) : '',
                    is_active: s.is_active,
                });
            })
            .catch((err) => toast.error(errorMessage(err, 'Could not load the service')))
            .finally(() => setLoading(false));
    }, [service_id]);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.put(`/api/vendor/services/${service_id}`, {
                name: form.name,
                description: form.description || null,
                price: Number(form.price),
                duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
                is_active: form.is_active,
            });
            toast.success('Service updated');
            router.visit('/vendor/services');
        } catch (err) {
            toast.error(errorMessage(err, 'Save failed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppLayout title="Edit service">
            <Head title="Edit service" />
            <div className="mx-auto max-w-2xl space-y-4">
                <VendorTabs />

                {loading ? (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <TableSkeleton rows={4} cols={2} />
                    </div>
                ) : !service ? (
                    <p className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow dark:bg-gray-800">
                        Service not found.{' '}
                        <Link href="/vendor/services" className="text-indigo-600 hover:underline">
                            Back to services
                        </Link>
                    </p>
                ) : (
                    <form onSubmit={save} className="space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit service</h1>
                            <Link href="/vendor/services" className="text-sm text-gray-500 hover:text-indigo-600">
                                Back to services
                            </Link>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input
                                required
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                                <input
                                    required
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={form.price}
                                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (minutes)</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.duration_minutes}
                                    onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                                    placeholder="optional"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            Visible on my store page
                        </label>

                        <div className="flex justify-end gap-2">
                            <Link href="/vendor/services" className="rounded-lg px-4 py-2 text-sm text-gray-500">
                                Cancel
                            </Link>
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
