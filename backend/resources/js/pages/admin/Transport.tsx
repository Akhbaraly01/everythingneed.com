import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Plane, Car, Truck, MapPin } from 'lucide-react';

interface Flight { id: string; flight_number: string; airline: string; origin_city: string; destination_city: string; price: number; is_active: boolean; }
interface Ride { id: string; pickup_address: string; dropoff_address: string; status: string; fare: number; }

export default function AdminTransport() {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'flights' | 'rides'>('flights');

    useEffect(() => {
        Promise.all([
            api.get<{ data: Flight[] }>('/api/flights').catch(() => ({ data: [] as Flight[] })),
            api.get<{ data: Ride[] }>('/api/rides').catch(() => ({ data: [] as Ride[] })),
        ]).then(([f, r]) => { setFlights((f as any).data?.data || (f as any).data || []); setRides((r as any).data || []); }).finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Transport Management">
            <Head title="Transport Management" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transport Management</h1>
                <div className="flex gap-2">
                    <button onClick={() => setTab('flights')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${tab === 'flights' ? 'bg-blue-600 text-white' : 'bg-white border dark:bg-gray-800'}`}><Plane className="h-4 w-4" /> Flights ({flights.length})</button>
                    <button onClick={() => setTab('rides')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${tab === 'rides' ? 'bg-blue-600 text-white' : 'bg-white border dark:bg-gray-800'}`}><Car className="h-4 w-4" /> Rides ({rides.length})</button>
                </div>
                {loading ? <p className="text-gray-500">Loading...</p> : tab === 'flights' ? (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700"><tr><th className="px-4 py-3">Flight</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th></tr></thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {flights.map((f) => <tr key={f.id}><td className="px-4 py-3 font-medium dark:text-white">{f.flight_number} • {f.airline}</td><td className="px-4 py-3">{f.origin_city} → {f.destination_city}</td><td className="px-4 py-3">${f.price}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${f.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{f.is_active ? 'Active' : 'Inactive'}</span></td></tr>)}
                                {flights.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">No flights</td></tr>}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700"><tr><th className="px-4 py-3">Route</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Fare</th></tr></thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {rides.map((r) => <tr key={r.id}><td className="px-4 py-3">{r.pickup_address} → {r.dropoff_address}</td><td className="px-4 py-3"><span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">{r.status}</span></td><td className="px-4 py-3">${r.fare}</td></tr>)}
                                {rides.length === 0 && <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-500">No rides</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
