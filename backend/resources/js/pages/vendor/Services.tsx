import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CalendarCheck, ArrowRight } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import ConfirmDialog, { EmptyState, TableSkeleton } from '@/components/shared/Ui';
import VendorTabs from '@/components/vendor/VendorTabs';

interface VendorService {
    id: string;
    name: string;
    description?: string | null;
    price: number | string;
    duration_minutes?: number | null;
    is_active: boolean;
    created_at: string;
}

export default function VendorServicesPage() {
    const [rows, setRows] = useState<VendorService[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingDelete, setPendingDelete] = useState<VendorService | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        api.get<{ data: VendorService[] }>('/api/vendor/services')
            .then((res) => setRows(res.data ?? []))
            .catch((err) => toast.error(errorMessage(err, 'Could not load services')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const destroy = useCallback(async (service: VendorService) => {
        setBusy(true);
        try {
            await api.del(`/api/vendor/services/${service.id}`);
            toast.success('Service deleted');
            setRows((r) => r.filter((s) => s.id !== service.id));
            setPendingDelete(null);
        } catch (err) {
            toast.error(errorMessage(err, 'Delete failed'));
        } finally {
            setBusy(false);
        }
    }, []);

    return (
        <AppLayout title="Vendor services">
            <Head title="My services" />
            <div className="mx-auto max-w-5xl space-y-4">
                <VendorTabs />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Services</h1>
                        <p className="text-sm text-gray-500">Services customers can book directly from your store page.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/vendor/bookings"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            <CalendarCheck className="h-4 w-4" /> Bookings
                        </Link>
                        <Link
                            href="/vendor/services/create"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" /> Add service
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <TableSkeleton rows={4} cols={5} />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                        <EmptyState
                            icon={<CalendarCheck className="h-10 w-10" />}
                            title="No services yet"
                            action={
                                <Link
                                    href="/vendor/services/create"
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    Create your first service
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-5 py-3">Service</th>
                                    <th className="px-5 py-3">Price</th>
                                    <th className="px-5 py-3">Duration</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {rows.map((service) => (
                                    <tr key={service.id}>
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                                            {service.description && (
                                                <p className="line-clamp-1 text-xs text-gray-500">{service.description}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-indigo-600">{formatCurrency(Number(service.price))}</td>
                                        <td className="px-5 py-3 text-gray-500">{service.duration_minutes ? `${service.duration_minutes} min` : '-'}</td>
                                        <td className="px-5 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                                {service.is_active ? 'Active' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/vendor/services/${service.id}/edit`}
                                                    className="text-gray-400 hover:text-indigo-600"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingDelete(service)}
                                                    className="text-gray-400 hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <Link
                                                    href="/vendor/bookings"
                                                    className="text-gray-400 hover:text-indigo-600"
                                                    title="View bookings"
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <ConfirmDialog
                    open={pendingDelete !== null}
                    title={`Delete "${pendingDelete?.name ?? ''}"?`}
                    description="Customers will no longer be able to book this service."
                    confirmLabel="Delete service"
                    danger
                    busy={busy}
                    onConfirm={() => pendingDelete && destroy(pendingDelete)}
                    onCancel={() => setPendingDelete(null)}
                />
            </div>
        </AppLayout>
    );
}
