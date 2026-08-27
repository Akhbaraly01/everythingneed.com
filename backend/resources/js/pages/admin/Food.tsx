import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { UtensilsCrossed, MapPin, Star } from 'lucide-react';

interface Restaurant {
    id: string;
    name: string;
    cuisine_type: string;
    city: string;
    rating: number;
    is_active: boolean;
}

export default function AdminFood() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Restaurant[] }>('/api/restaurants')
            .then((res) => setRestaurants((res.data as any)?.data || res.data || []))
            .catch(() => setRestaurants([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Restaurant Management">
            <Head title="Restaurant Management" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><UtensilsCrossed className="h-6 w-6" /> Restaurant Management</h1>
                {loading ? <p className="text-gray-500">Loading...</p> : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr><th className="px-4 py-3">Restaurant</th><th className="px-4 py-3">Cuisine</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Status</th></tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {restaurants.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3 font-medium dark:text-white">{r.name}</td>
                                        <td className="px-4 py-3">{r.cuisine_type}</td>
                                        <td className="px-4 py-3 text-gray-500">{r.city}</td>
                                        <td className="px-4 py-3 flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400" />{r.rating || 'New'}</td>
                                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${r.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.is_active ? 'Active' : 'Inactive'}</span></td>
                                    </tr>
                                ))}
                                {restaurants.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No restaurants</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
