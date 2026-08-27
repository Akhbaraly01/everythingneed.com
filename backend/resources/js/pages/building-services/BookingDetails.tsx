import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { HardHat, Calendar, MapPin, DollarSign, CheckCircle } from 'lucide-react';

interface Booking {
    id: string;
    worker_type: string;
    service_category: string;
    description: string;
    address: string;
    scheduled_date: string;
    scheduled_time: string;
    estimated_cost: number;
    notes: string;
    status: string;
}

export default function BuildingServiceBookingDetails({ booking_id }: { booking_id?: string }) {
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = booking_id || new URLSearchParams(window.location.search).get('id') || window.location.pathname.split('/').pop();
        if (id) {
            api.get<{ data: Booking }>(`/api/building-services/bookings/${id}`)
                .then((res) => setBooking(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else setLoading(false);
    }, [booking_id]);

    if (loading) return <AppLayout title="Booking Details"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!booking) return <AppLayout title="Booking Details"><p className="p-12 text-center text-red-500">Booking not found</p></AppLayout>;

    return (
        <AppLayout title="Booking Details">
            <Head title="Booking Details" />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                        <HardHat className="h-6 w-6 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{booking.worker_type} — {booking.service_category}</h1>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{booking.status}</span>
                </div>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-3">
                    <p className="text-gray-700 dark:text-gray-300">{booking.description}</p>
                    <div className="divide-y dark:divide-gray-700">
                        <div className="flex justify-between py-2"><span className="text-gray-500 flex items-center gap-1"><MapPin className="h-4 w-4" /> Address</span><span className="font-medium dark:text-white">{booking.address}</span></div>
                        <div className="flex justify-between py-2"><span className="text-gray-500 flex items-center gap-1"><Calendar className="h-4 w-4" /> Date</span><span className="font-medium dark:text-white">{booking.scheduled_date} {booking.scheduled_time}</span></div>
                        <div className="flex justify-between py-2"><span className="text-gray-500 flex items-center gap-1"><DollarSign className="h-4 w-4" /> Budget</span><span className="font-medium dark:text-white">${booking.estimated_cost || 'TBD'}</span></div>
                    </div>
                    {booking.notes && <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded dark:bg-gray-700">{booking.notes}</p>}
                </div>
            </div>
        </AppLayout>
    );
}
