import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { CarTaxiFront, Power, CheckCircle2, MapPin } from 'lucide-react';

interface DriverProfile {
    id: string;
    full_name: string;
    phone: string;
    license_number: string;
    vehicle_type: string;
    is_available: boolean;
    rating?: number | string | null;
    total_rides?: number;
}

interface AvailableRide {
    id: string;
    pickup_address?: string | null;
    dropoff_address?: string | null;
    ride_type?: string | null;
    driver?: { full_name: string; rating?: number | string | null; vehicle_type?: string | null };
    vehicle_type?: string | null;
    fare_quote?: number | null;
    fare_note?: string;
}

interface Ride {
    id: string;
    pickup_address: string;
    dropoff_address: string;
    status: string;
    fare?: number | string | null;
    currency?: string | null;
    distance_km?: number | string | null;
    scheduled_for?: string | null;
}

const inputClass = 'w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700';

export default function DriverConsole() {
    const { auth } = usePage().props as { auth?: { user?: { name?: string } } };
    const [driver, setDriver] = useState<DriverProfile | null>(null);
    const [checking, setChecking] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [reg, setReg] = useState({ full_name: '', phone: '', license_number: '', vehicle_type: '' });
    const [registering, setRegistering] = useState(false);
    const [available, setAvailable] = useState<AvailableRide[]>([]);
    const [activeRide, setActiveRide] = useState<Ride | null>(null);
    const [loadingConsole, setLoadingConsole] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [pendingId, setPendingId] = useState<string | null>(null);

    useEffect(() => {
        setReg((prev) =>
            prev.full_name === '' && auth?.user?.name ? { ...prev, full_name: auth.user.name } : prev,
        );
    }, [auth?.user?.name]);

    const loadDriver = useCallback(() => {
        setChecking(true);
        setPageError(null);
        api.get<{ data: DriverProfile }>('/api/drivers/me')
            .then((res) => setDriver(res.data))
            .catch((e) => {
                if (e instanceof ApiError && e.status === 404) {
                    setDriver(null);
                } else {
                    setPageError(errorMessage(e, 'Failed to load driver profile'));
                }
            })
            .finally(() => setChecking(false));
    }, []);

    const loadConsole = useCallback(() => {
        setLoadingConsole(true);
        Promise.all([
            api.get<{ data: AvailableRide[] }>('/api/rides/available'),
            api.get<{ data: Ride[] }>('/api/drivers/rides', { params: { per_page: 50 } }),
        ])
            .then(([availRes, ridesRes]) => {
                setAvailable(availRes.data);
                setActiveRide(
                    ridesRes.data.find((r) => r.status === 'accepted' || r.status === 'in_progress') ?? null,
                );
            })
            .catch((e) => toast.error(errorMessage(e, 'Failed to load rides')))
            .finally(() => setLoadingConsole(false));
    }, []);

    useEffect(loadDriver, [loadDriver]);
    useEffect(() => {
        if (driver) loadConsole();
    }, [driver, loadConsole]);

    const submitRegistration = async (e: FormEvent) => {
        e.preventDefault();
        setRegistering(true);
        try {
            const res = await api.post<{ message?: string }>('/api/drivers', reg);
            toast.success(res.message ?? 'Registered as a driver');
            setReg({ full_name: '', phone: '', license_number: '', vehicle_type: '' });
            loadDriver();
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to register as a driver'));
            if (err instanceof ApiError && err.status === 409) loadDriver();
        } finally {
            setRegistering(false);
        }
    };

    const toggleAvailability = async () => {
        if (!driver) return;
        setToggling(true);
        const next = !driver.is_available;
        try {
            const res = await api.put<{ message?: string; data: DriverProfile }>(
                '/api/drivers/me/availability',
                { is_available: next },
            );
            setDriver(res.data);
            toast.success(res.message ?? (next ? 'You are online' : 'You are offline'));
            loadConsole();
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to update availability'));
        } finally {
            setToggling(false);
        }
    };

    const acceptRide = async (id: string) => {
        setPendingId(id);
        try {
            const res = await api.post<{ message?: string }>(`/api/rides/${id}/accept`);
            toast.success(res.message ?? 'Ride accepted');
            loadConsole();
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to accept the ride'));
        } finally {
            setPendingId(null);
        }
    };

    const completeRide = async () => {
        if (!activeRide) return;
        setPendingId(activeRide.id);
        try {
            const res = await api.post<{ message?: string }>(`/api/rides/${activeRide.id}/complete`);
            toast.success(res.message ?? 'Ride completed');
            loadConsole();
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to complete the ride'));
        } finally {
            setPendingId(null);
        }
    };

    return (
        <AppLayout title="Driver Console">
            <Head title="Driver Console" />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <CarTaxiFront className="h-6 w-6" /> Driver Console
                    </h1>
                    <Link href="/transportation/driver/earnings" className="text-sm text-blue-600 hover:underline">
                        View earnings
                    </Link>
                </div>

                {checking ? (
                    <p className="text-gray-500">Loading...</p>
                ) : pageError ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="font-medium text-red-600">{pageError}</p>
                        <Button onClick={loadDriver} variant="ghost" size="sm" className="mt-4">
                            Retry
                        </Button>
                    </div>
                ) : !driver ? (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Become a driver</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Register once to start accepting rides on the platform.
                        </p>
                        <form onSubmit={submitRegistration} className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="driver-full-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Full name
                                </label>
                                <input
                                    id="driver-full-name"
                                    required
                                    value={reg.full_name}
                                    onChange={(e) => setReg({ ...reg, full_name: e.target.value })}
                                    className={inputClass}
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label htmlFor="driver-phone" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Phone
                                </label>
                                <input
                                    id="driver-phone"
                                    required
                                    value={reg.phone}
                                    onChange={(e) => setReg({ ...reg, phone: e.target.value })}
                                    className={inputClass}
                                    placeholder="Contact number"
                                />
                            </div>
                            <div>
                                <label htmlFor="driver-license" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    License number
                                </label>
                                <input
                                    id="driver-license"
                                    required
                                    value={reg.license_number}
                                    onChange={(e) => setReg({ ...reg, license_number: e.target.value })}
                                    className={inputClass}
                                    placeholder="Driving license number"
                                />
                            </div>
                            <div>
                                <label htmlFor="driver-vehicle" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Vehicle type
                                </label>
                                <input
                                    id="driver-vehicle"
                                    required
                                    value={reg.vehicle_type}
                                    onChange={(e) => setReg({ ...reg, vehicle_type: e.target.value })}
                                    className={inputClass}
                                    placeholder="e.g. Sedan, SUV, Minibus"
                                />
                            </div>
                            <Button type="submit" loading={registering} fullWidth>
                                Register as driver
                            </Button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white">{driver.full_name}</p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {driver.vehicle_type} · License {driver.license_number} · {driver.phone}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {driver.rating != null ? `★ ${driver.rating}` : 'New driver'} ·{' '}
                                        {driver.total_rides ?? 0} ride(s) completed
                                    </p>
                                </div>
                                <Button
                                    variant={driver.is_available ? 'success' : 'outline'}
                                    size="sm"
                                    onClick={toggleAvailability}
                                    loading={toggling}
                                    iconLeft={<Power className="h-4 w-4" />}
                                >
                                    {driver.is_available ? 'Online' : 'Offline'}
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                <CheckCircle2 className="h-4 w-4" /> Current ride
                            </h2>
                            {loadingConsole ? (
                                <p className="mt-3 text-sm text-gray-500">Loading...</p>
                            ) : activeRide ? (
                                <div className="mt-3 space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 shrink-0 text-green-500" />
                                        <span>{activeRide.pickup_address}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 shrink-0 text-red-500" />
                                        <span>{activeRide.dropoff_address}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium capitalize text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                            {activeRide.status.replace('_', ' ')}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="success"
                                            onClick={completeRide}
                                            loading={pendingId === activeRide.id}
                                            iconLeft={<CheckCircle2 className="h-4 w-4" />}
                                        >
                                            Complete ride
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-3 text-sm text-gray-500">No active ride right now.</p>
                            )}
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                <CarTaxiFront className="h-4 w-4" /> Available ride requests
                            </h2>
                            {!driver.is_available ? (
                                <p className="mt-3 text-sm text-gray-500">
                                    You&apos;re offline. Go online to see ride requests.
                                </p>
                            ) : loadingConsole ? (
                                <p className="mt-3 text-sm text-gray-500">Loading...</p>
                            ) : available.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-500">No ride requests available right now.</p>
                            ) : (
                                <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-700">
                                    {available.map((r) => (
                                        <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                    {r.pickup_address
                                                        ? `${r.pickup_address} → ${r.dropoff_address ?? ''}`
                                                        : `${r.driver?.full_name ?? 'Ride request'}${
                                                              r.vehicle_type ? ` · ${r.vehicle_type}` : ''
                                                          }`}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {r.fare_note ??
                                                        (r.ride_type ? r.ride_type : 'Fare confirmed on completion')}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => acceptRide(r.id)}
                                                loading={pendingId === r.id}
                                                disabled={!!activeRide}
                                            >
                                                Accept
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {activeRide && driver.is_available && (
                                <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                    Finish your current ride before accepting another.
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
