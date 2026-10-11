import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarCheck } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { EmptyState, StatusBadge, TableSkeleton } from '@/components/shared/Ui';
import VendorTabs from '@/components/vendor/VendorTabs';

interface VendorBooking {
    id: string;
    status: string;
    service_type: string;
    service_id?: string | null;
    details?: { scheduled_date?: string; scheduled_time?: string; notes?: string } | null;
    user?: { id: string; name: string; email?: string };
    created_at: string;
}

export default function VendorBookings() {
    const [rows, setRows] = useState<VendorBooking[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        api.get<{ data: VendorBooking[] }>('/api/vendor/bookings')
            .then((res) => setRows(res.data ?? []))
            .catch((err) => toast.error(errorMessage(err, 'Could not load bookings')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <AppLayout title="Vendor bookings">
            <Head title="Bookings" />
            <div className="mx-auto max-w-5xl space-y-4">
                <VendorTabs />

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
                    <p className="text-sm text-gray-500">Customer bookings against your services.</p>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <TableSkeleton rows={5} cols={4} />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                        <EmptyState
                            icon={<CalendarCheck className="h-10 w-10" />}
                            title="No bookings yet"
                            description="Bookings appear here when customers reserve one of your services."
                        />
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Scheduled</th>
                                    <th className="px-5 py-3">Notes</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Requested</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {rows.map((booking) => (
                                    <tr key={booking.id}>
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{booking.user?.name ?? 'Customer'}</p>
                                            {booking.user?.email && <p className="text-xs text-gray-500">{booking.user.email}</p>}
                                        </td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                                            {booking.details?.scheduled_date
                                                ? `${booking.details.scheduled_date}${booking.details.scheduled_time ? ` ${booking.details.scheduled_time}` : ''}`
                                                : '-'}
                                        </td>
                                        <td className="max-w-xs truncate px-5 py-3 text-gray-500">
                                            {booking.details?.notes || '-'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                        <td className="px-5 py-3 text-xs text-gray-400">{formatDateTime(booking.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
