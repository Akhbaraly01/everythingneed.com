import { statusTone } from '@/lib/lifecycle';
import { EmptyState } from '@/components/shared/Ui';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { useState } from 'react';
import {Plane, BedDouble, UtensilsCrossed, CalendarClock, ChevronLeft, ChevronRight} from 'lucide-react';

interface BookingRow {
    id: string;
    service_type: string;
    service_id: string;
    status: string;
    details?: Record<string, unknown>;
    created_at: string;
}

interface Props {
    bookings: { data: BookingRow[]; current_page: number; last_page: number; total: number };
}

const typeIcons: Record<string, React.ReactNode> = {
    flight: <Plane className="h-4 w-4 text-sky-500" />,
    hotel: <BedDouble className="h-4 w-4 text-indigo-500" />,
    food: <UtensilsCrossed className="h-4 w-4 text-orange-500" />,
};

function title(b: BookingRow): string {
    const d = (b.details ?? {}) as Record<string, string>;
    return d.route ?? d.hotel_name ?? d.restaurant_name ?? `${b.service_type} booking`;
}

export default function MyBookings({ bookings }: Props) {
    const [busyId, setBusyId] = useState<string | null>(null);

    const cancel = async (id: string) => {
        setBusyId(id);
        try {
            await api.post(`/api/bookings/${id}/cancel`);
            toast.success('Booking cancelled — any held inventory has been released.');
            router.reload({ only: ['bookings'] });
        } catch (err) {
            toast.error(errorMessage(err, 'Cancellation failed'));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <AppLayout title="My bookings">
            <Head title="My bookings" />
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
                    <p className="text-sm text-gray-500">{bookings.total} bookings across all services</p>
                </div>

                {bookings.data.length === 0 ? (
                    <EmptyState
                        icon={<CalendarClock className="h-10 w-10 text-gray-300" />}
                        title="No bookings yet"
                        description="Flights, hotels and more will appear here."
                        action={
                            <Link href="/flights" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
                                Book a flight
                            </Link>
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {bookings.data.map((b) => (
                            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700">
                                        {typeIcons[b.service_type] ?? <CalendarClock className="h-4 w-4 text-gray-400" />}
                                    </span>
                                    <div>
                                        <p className="font-medium capitalize text-gray-900 dark:text-white">{title(b)}</p>
                                        <p className="text-xs text-gray-500">
                                            Booked {formatDate(b.created_at)}
                                            {(b.details?.reference as string) ? ` · Ref ${b.details?.reference}` : ''}
                                            {(b.details?.travel_date as string) ? ` · Travel ${b.details?.travel_date}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusTone(b.status)}`}>
                                        {b.status.replace('_', ' ')}
                                    </span>
                                    {b.service_type === 'flight' && !!b.details?.total_price && (
                                        <span className="text-sm font-semibold text-sky-600">{formatPrice(Number(b.details.total_price))}</span>
                                    )}
                                    {!['cancelled', 'completed', 'checked_out'].includes(b.status) && (
                                        <button
                                            disabled={busyId === b.id}
                                            onClick={() => cancel(b.id)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    {b.service_type === 'flight' && !!b.details?.reference && (
                                        <Link href={`/flights/confirmation/${b.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                                            View ticket
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {bookings.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        {bookings.current_page > 1 && (
                            <Link href={`/bookings?page=${bookings.current_page - 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white">
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-300">Page {bookings.current_page} of {bookings.last_page}</span>
                        {bookings.current_page < bookings.last_page && (
                            <Link href={`/bookings?page=${bookings.current_page + 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white">
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
