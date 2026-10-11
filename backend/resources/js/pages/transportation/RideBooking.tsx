import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import {useState} from 'react';
import {Car, ArrowRight} from 'lucide-react';

interface Vehicle {
    id: string;
    driver: { full_name: string; rating?: number | null };
    vehicle_type: string;
    fare_quote?: number | null;
    fare_note?: string;
}

export default function RideBooking() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [form, setForm] = useState({ pickup_address: '', dropoff_address: '', pickup_lat: 0, pickup_lng: 0, dropoff_lat: 0, dropoff_lng: 0 });
    const [submitting, setSubmitting] = useState(false);

    const searchVehicles = async () => {
        if (!form.pickup_address || !form.dropoff_address) return;
        setLoading(true);
        try {
            const res = await api.get<{ data: Vehicle[] }>('/api/rides/available', { params: form });
            setVehicles(res.data);
        } catch (err) {
            setVehicles([]);
            toast.error(errorMessage(err, 'Could not search for available vehicles'));
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!selectedVehicle) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/rides', {
                vehicle_id: selectedVehicle.id,
                ...form,
            });
            router.visit(`/transportation/tracking/${res.data.id}`);
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to book the ride'));
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="Book a Ride">
            <Head title="Book a Ride" />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Car className="h-6 w-6" /> Book a Ride</h1>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Location</label>
                        <input
                            required
                            value={form.pickup_address}
                            onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                            placeholder="Enter pickup address"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Drop-off Location</label>
                        <input
                            required
                            value={form.dropoff_address}
                            onChange={(e) => setForm({ ...form, dropoff_address: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                            placeholder="Enter destination"
                        />
                    </div>
                    <button
                        onClick={searchVehicles}
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search Available Vehicles'}
                    </button>
                </div>

                {vehicles.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Available Vehicles</h2>
                        {vehicles.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVehicle(v)}
                                className={`w-full rounded-lg bg-white p-4 shadow text-left dark:bg-gray-800 ${selectedVehicle?.id === v.id ? 'ring-2 ring-blue-500' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{v.driver.full_name}</p>
                                        <p className="text-sm text-gray-500">{v.vehicle_type} • ★ {v.driver.rating || 'New'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {v.fare_quote != null ? `$${v.fare_quote}` : 'Quote on accept'}
                                        </p>
                                        <p className="text-xs text-gray-500">{v.fare_note ?? 'Fare confirmed by driver'}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                        <button
                            onClick={handleBook}
                            disabled={!selectedVehicle || submitting}
                            className="w-full rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? 'Booking...' : 'Confirm Booking'} <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
