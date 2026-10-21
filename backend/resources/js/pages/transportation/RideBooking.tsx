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

interface FareEstimate {
    distance_km: number;
    duration_minutes: number;
    fare_min: number;
    fare_max: number;
    currency: string;
    ride_type: string;
    note: string;
}

const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

const isLatitude = (value: string): boolean => {
    if (value.trim() === '') return false;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= LAT_MIN && parsed <= LAT_MAX;
};

const isLongitude = (value: string): boolean => {
    if (value.trim() === '') return false;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= LNG_MIN && parsed <= LNG_MAX;
};

export default function RideBooking() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [form, setForm] = useState({ pickup_address: '', dropoff_address: '', pickup_lat: '', pickup_lng: '', dropoff_lat: '', dropoff_lng: '', ride_type: 'economy', scheduled_for: '' });
    const [submitting, setSubmitting] = useState(false);
    const [estimate, setEstimate] = useState<FareEstimate | null>(null);
    const [estimating, setEstimating] = useState(false);

    const hasCoords =
        isLatitude(form.pickup_lat) &&
        isLongitude(form.pickup_lng) &&
        isLatitude(form.dropoff_lat) &&
        isLongitude(form.dropoff_lng);

    const fetchEstimate = async () => {
        if (!hasCoords) return;
        setEstimating(true);
        try {
            const res = await api.get<{ data: FareEstimate }>('/api/rides/estimate', {
                params: {
                    pickup_lat: Number(form.pickup_lat),
                    pickup_lng: Number(form.pickup_lng),
                    dropoff_lat: Number(form.dropoff_lat),
                    dropoff_lng: Number(form.dropoff_lng),
                    ride_type: form.ride_type,
                },
            });
            setEstimate(res.data);
        } catch (err) {
            setEstimate(null);
            toast.error(errorMessage(err, 'Could not estimate fare'));
        } finally {
            setEstimating(false);
        }
    };

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
        if (!selectedVehicle || !hasCoords) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/rides', {
                vehicle_id: selectedVehicle.id,
                pickup_address: form.pickup_address,
                dropoff_address: form.dropoff_address,
                pickup_lat: Number(form.pickup_lat),
                pickup_lng: Number(form.pickup_lng),
                dropoff_lat: Number(form.dropoff_lat),
                dropoff_lng: Number(form.dropoff_lng),
                ride_type: form.ride_type,
                scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : undefined,
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ride type</label>
                        <select
                            value={form.ride_type}
                            onChange={(e) => setForm({ ...form, ride_type: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                        >
                            <option value="economy">Economy</option>
                            <option value="comfort">Comfort</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule (optional)</label>
                        <input
                            type="datetime-local"
                            value={form.scheduled_for}
                            min={new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)}
                            onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <p className="mt-1 text-xs text-gray-500">Leave empty to request a ride now. Scheduled rides must be at least 30 minutes out (max 30 days).</p>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Coordinates <span className="text-red-500">*</span>
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="pickup-lat" className="block text-xs font-medium text-gray-600 dark:text-gray-400">Pickup latitude *</label>
                                <input
                                    id="pickup-lat"
                                    type="number"
                                    inputMode="decimal"
                                    step="any"
                                    min={LAT_MIN}
                                    max={LAT_MAX}
                                    required
                                    value={form.pickup_lat}
                                    onChange={(e) => setForm({ ...form, pickup_lat: e.target.value })}
                                    aria-label="Pickup latitude"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                                    placeholder="-90 to 90"
                                />
                                {form.pickup_lat !== '' && !isLatitude(form.pickup_lat) && (
                                    <p className="mt-1 text-xs text-red-600">Enter a latitude between -90 and 90.</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="pickup-lng" className="block text-xs font-medium text-gray-600 dark:text-gray-400">Pickup longitude *</label>
                                <input
                                    id="pickup-lng"
                                    type="number"
                                    inputMode="decimal"
                                    step="any"
                                    min={LNG_MIN}
                                    max={LNG_MAX}
                                    required
                                    value={form.pickup_lng}
                                    onChange={(e) => setForm({ ...form, pickup_lng: e.target.value })}
                                    aria-label="Pickup longitude"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                                    placeholder="-180 to 180"
                                />
                                {form.pickup_lng !== '' && !isLongitude(form.pickup_lng) && (
                                    <p className="mt-1 text-xs text-red-600">Enter a longitude between -180 and 180.</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="dropoff-lat" className="block text-xs font-medium text-gray-600 dark:text-gray-400">Drop-off latitude *</label>
                                <input
                                    id="dropoff-lat"
                                    type="number"
                                    inputMode="decimal"
                                    step="any"
                                    min={LAT_MIN}
                                    max={LAT_MAX}
                                    required
                                    value={form.dropoff_lat}
                                    onChange={(e) => setForm({ ...form, dropoff_lat: e.target.value })}
                                    aria-label="Dropoff latitude"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                                    placeholder="-90 to 90"
                                />
                                {form.dropoff_lat !== '' && !isLatitude(form.dropoff_lat) && (
                                    <p className="mt-1 text-xs text-red-600">Enter a latitude between -90 and 90.</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="dropoff-lng" className="block text-xs font-medium text-gray-600 dark:text-gray-400">Drop-off longitude *</label>
                                <input
                                    id="dropoff-lng"
                                    type="number"
                                    inputMode="decimal"
                                    step="any"
                                    min={LNG_MIN}
                                    max={LNG_MAX}
                                    required
                                    value={form.dropoff_lng}
                                    onChange={(e) => setForm({ ...form, dropoff_lng: e.target.value })}
                                    aria-label="Dropoff longitude"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                                    placeholder="-180 to 180"
                                />
                                {form.dropoff_lng !== '' && !isLongitude(form.dropoff_lng) && (
                                    <p className="mt-1 text-xs text-red-600">Enter a longitude between -180 and 180.</p>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={fetchEstimate}
                            disabled={!hasCoords || estimating}
                            className="mt-3 w-full rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-400 dark:text-blue-400"
                        >
                            {estimating ? 'Estimating...' : 'Get fare estimate'}
                        </button>
                    </div>
                    {estimate && (
                        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20" role="status" aria-live="polite">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                Estimated fare: ${estimate.fare_min.toFixed(2)} – ${estimate.fare_max.toFixed(2)} {estimate.currency}
                            </p>
                            <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                {estimate.distance_km} km · ~{estimate.duration_minutes} min · {estimate.ride_type}
                            </p>
                            <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-300/80">{estimate.note}</p>
                        </div>
                    )}
                    <button
                        onClick={searchVehicles}
                        disabled={loading || !form.pickup_address.trim() || !form.dropoff_address.trim()}
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
                            disabled={!selectedVehicle || submitting || !hasCoords}
                            className="w-full rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? 'Booking...' : 'Confirm Booking'} <ArrowRight className="h-4 w-4" />
                        </button>
                        {!hasCoords && (
                            <p className="mt-2 text-center text-xs text-red-600">
                                Enter valid pickup and drop-off coordinates to book this ride.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
