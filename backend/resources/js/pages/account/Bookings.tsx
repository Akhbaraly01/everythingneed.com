import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Calendar, Hotel, Plane, HardHat, Stethoscope, MapPin } from 'lucide-react';

interface Booking {
    id: string;
    service_type: string;
    details: any;
    status: string;
    created_at: string;
}

export default function AccountBookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        api.get<{ data: Booking[] }>('/api/bookings')
            .then((res) => setBookings(res.data))
            .catch(() => setBookings([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.service_type === filter);

    return (
        <AppLayout title="My Bookings">
            <Head title="My Bookings" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Calendar className="h-6 w-6" /> My Bookings</h1>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'hotel', 'flight', 'building', 'healthcare', 'transport'].map((t) => (
                        <button key={t} onClick={() => setFilter(t)} className={`rounded-full px-4 py-1.5 text-sm capitalize ${filter === t ? 'bg-blue-600 text-white' : 'bg-white border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}`}>{t}</button>
                    ))}
                </div>
                {loading ? <p className="text-gray-500">Loading...</p> : filtered.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No bookings found</p>
                        <div className="mt-4 flex justify-center gap-2">
                            <Link href="/hotels" className="text-blue-600 hover:underline text-sm">Browse Hotels</Link>
                            <Link href="/flights" className="text-blue-600 hover:underline text-sm">Search Flights</Link>
                            <Link href="/healthcare" className="text-blue-600 hover:underline text-sm">Healthcare</Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((b) => (
                            <div key={b.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium capitalize bg-blue-50 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-300">{b.service_type}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${b.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{b.status}</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{JSON.stringify(b.details).slice(0, 100)}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(b.created_at).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
