import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import {MapPin, CheckCircle} from 'lucide-react';

interface Ride {
    id: string;
    pickup_address: string;
    dropoff_address: string;
    status: string;
    fare: number;
    driver: { full_name: string; phone: string };
    distance_km: number;
    duration_minutes: number;
    started_at: string;
    completed_at: string;
}

const STATUS_STEPS = ['requested', 'accepted', 'in_progress', 'completed'];

export default function RideTracking({ ride_id }: { ride_id?: string }) {
    const [ride, setRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (ride_id) {
            api.get<{ data: Ride }>(`/api/rides/${ride_id}`)
                .then((res) => setRide(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [ride_id]);

    if (loading) return <AppLayout title="Ride Tracking"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!ride) return <AppLayout title="Ride Tracking"><p className="p-12 text-center text-red-500">Ride not found</p></AppLayout>;

    const currentStep = STATUS_STEPS.indexOf(ride.status);

    return (
        <AppLayout title="Ride Tracking">
            <Head title="Ride Tracking" />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ride Status</h1>
                    <div className="flex items-center justify-between">
                        {STATUS_STEPS.map((step, i) => (
                            <div key={step} className="flex items-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'}`}>
                                    {i <= currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
                                </div>
                                {i < STATUS_STEPS.length - 1 && (
                                    <div className={`h-1 w-12 ${i < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                        {STATUS_STEPS.map((s) => <span key={s} className="capitalize">{s.replace('_', ' ')}</span>)}
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-3">
                    <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-green-500" /><span>{ride.pickup_address}</span></div>
                    <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-red-500" /><span>{ride.dropoff_address}</span></div>
                    {ride.driver && (
                        <div className="border-t pt-3 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-white">{ride.driver.full_name}</p>
                            <p className="text-sm text-gray-500">{ride.driver.phone}</p>
                        </div>
                    )}
                    <div className="border-t pt-3 dark:border-gray-700 flex justify-between">
                        <span className="text-gray-500">{ride.distance_km}km • {ride.duration_minutes}min</span>
                        <span className="font-bold text-gray-900 dark:text-white">${ride.fare}</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
