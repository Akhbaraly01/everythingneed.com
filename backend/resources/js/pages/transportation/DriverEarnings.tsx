import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { useCallback, useEffect, useState } from 'react';
import { Wallet, RefreshCcw, Car } from 'lucide-react';

interface EarningsData {
    total_earned: number;
    today: number;
    week: number;
    month: number;
    ride_count: number;
    average_fare: number;
    currency: string;
    driver: { full_name: string; total_rides: number; rating?: number | null; vehicle_type?: string | null };
    recent: { id: string; dropoff_address?: string | null; fare?: string | number | null; distance_km?: string | number | null; completed_at?: string | null }[];
}

export default function DriverEarnings() {
    const [data, setData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        api.get<{ data: EarningsData }>('/api/drivers/earnings')
            .then((res) => setData(res.data))
            .catch((e) => setError(errorMessage(e, 'Failed to load earnings')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const money = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    return (
        <AppLayout title="Driver Earnings">
            <Head title="Driver Earnings" />
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <Wallet className="h-6 w-6" /> Driver Earnings
                    </h1>
                    <Link href="/transportation/ride-booking" className="text-sm text-blue-600 hover:underline">Back to rides</Link>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <Button onClick={load} variant="ghost" size="sm" className="mt-4 gap-2" iconLeft={<RefreshCcw className="h-4 w-4" />}>
                            Retry
                        </Button>
                    </div>
                ) : data ? (
                    <>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">
                                {data.driver.full_name} · {data.driver.vehicle_type ?? 'driver'} · {data.driver.rating ? `★ ${data.driver.rating}` : 'New driver'}
                            </p>
                            <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
                                {money(data.total_earned)} <span className="text-base font-normal text-gray-400">{data.currency}</span>
                            </p>
                            <p className="mt-1 text-sm text-gray-500">Total from {data.ride_count} completed ride(s) · avg {money(data.average_fare)}</p>
                            <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                Earnings are confirmed fares from completed rides. Payouts arrive once ride payments go live.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <p className="text-xs uppercase tracking-wide text-gray-400">Today</p>
                                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{money(data.today)}</p>
                            </div>
                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <p className="text-xs uppercase tracking-wide text-gray-400">Last 7 days</p>
                                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{money(data.week)}</p>
                            </div>
                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <p className="text-xs uppercase tracking-wide text-gray-400">Last 30 days</p>
                                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{money(data.month)}</p>
                            </div>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                <Car className="h-4 w-4" /> Recent rides
                            </h2>
                            {data.recent.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-500">No completed rides yet.</p>
                            ) : (
                                <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
                                    {data.recent.map((r) => (
                                        <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{r.dropoff_address || 'Ride'}</p>
                                                <p className="text-xs text-gray-400">
                                                    {r.completed_at ? new Date(r.completed_at).toLocaleString() : ''}
                                                    {r.distance_km != null && ` · ${Number(r.distance_km)} km`}
                                                </p>
                                            </div>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {r.fare != null ? `$${Number(r.fare).toFixed(2)}` : '—'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </AppLayout>
    );
}
