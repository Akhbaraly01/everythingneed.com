import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useEffect, useState } from 'react';
import { HardHat, Calendar, MapPin, DollarSign, RefreshCcw } from 'lucide-react';

interface Booking {
    id: string;
    worker_type: string;
    service_category: string;
    description: string;
    address: string;
    scheduled_date: string;
    estimated_cost: number;
    status: string;
    created_at: string;
}

export default function BuildingServiceBookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: Booking[] }>('/api/building-services/bookings')
            .then((res) => setBookings(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load bookings'));
                setBookings([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    return (
        <AppLayout title="My Building Service Bookings">
            <Head title="My Bookings" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Building Service Bookings</h1>
                    <Link href="/building-services/book" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">New Booking</Link>
                </div>
                {loading ? <p className="text-gray-500">Loading...</p> : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={load} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <HardHat className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No bookings yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bookings.map((b) => (
                            <Link key={b.id} href={`/building-services/bookings/${b.id}`} className="block rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white capitalize">{b.worker_type} — {b.service_category}</p>
                                        <p className="text-sm text-gray-500 line-clamp-1">{b.description}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${b.status === 'completed' ? 'bg-green-100 text-green-800' : b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{b.status}</span>
                                </div>
                                <div className="mt-2 flex gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{b.scheduled_date}</span>
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.address}</span>
                                    {b.estimated_cost && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${b.estimated_cost}</span>}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
