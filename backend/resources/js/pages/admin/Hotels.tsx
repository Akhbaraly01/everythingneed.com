import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Hotel, Star, MapPin } from 'lucide-react';

interface HotelItem {
    id: string;
    name: string;
    city: string;
    country: string;
    star_rating: number;
    is_active: boolean;
    rooms_count?: number;
}

export default function AdminHotels() {
    const [hotels, setHotels] = useState<HotelItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: HotelItem[] }>('/api/hotels', { params: { per_page: 50 } })
            .then((res) => setHotels((res.data as any)?.data || res.data || []))
            .catch(() => setHotels([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Hotel Management">
            <Head title="Hotel Management" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Hotel className="h-6 w-6" /> Hotel Management</h1>
                {loading ? <p className="text-gray-500">Loading...</p> : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr><th className="px-4 py-3">Hotel</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Status</th></tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {hotels.map((h) => (
                                    <tr key={h.id}>
                                        <td className="px-4 py-3 font-medium dark:text-white">{h.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{h.city}, {h.country}</td>
                                        <td className="px-4 py-3">{'★'.repeat(h.star_rating || 0)}</td>
                                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${h.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{h.is_active ? 'Active' : 'Inactive'}</span></td>
                                    </tr>
                                ))}
                                {hotels.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">No hotels</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
