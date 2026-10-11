import { statusTone } from '@/lib/lifecycle';
import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import DataTable, { type Column } from '@/components/shared/DataTable';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plane, Car, Search, Power } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real admin flight row (FlightController::adminIndex). */
interface Flight {
    id: string;
    flight_number: string;
    airline: string;
    origin_city: string;
    destination_city: string;
    price: number;
    seats_available?: number;
    is_active: boolean;
}

/** Real admin ride row (RideController::adminIndex). */
interface Ride {
    id: string;
    pickup_address: string;
    dropoff_address: string;
    status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    fare: number;
    distance_km?: number | null;
    created_at: string;
    rider_name?: string | null;
    rider_email?: string | null;
}

interface PageMeta {
    page: number;
    per_page: number;
    total: number;
}

export default function AdminTransport() {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [rides, setRides] = useState<Ride[]>([]);
    const [rideMeta, setRideMeta] = useState<PageMeta | null>(null);
    const [flightMeta, setFlightMeta] = useState<{ total: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'flights' | 'rides'>('flights');
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get<{ data: Flight[]; meta: { total: number } }>('/api/admin/transport/flights').catch(() => ({ data: [] as Flight[], meta: { total: 0 } })),
            api.get<{ data: Ride[]; meta: PageMeta }>(`/api/admin/transport/rides?page=${page}&status=${status}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
                .catch(() => ({ data: [] as Ride[], meta: { page, per_page: 25, total: 0 } })),
        ])
            .then(([f, r]) => {
                setFlights(rows<Flight>(f));
                setFlightMeta(f.meta);
                setRides(rows<Ride>(r));
                setRideMeta(r.meta);
            })
            .catch(() => { /* caught per-request */ })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, status]);

    const searchRides = (e: FormEvent) => {
        e.preventDefault();
        setPage(1);
        setLoading(true);
        api.get<{ data: Ride[]; meta: PageMeta }>(`/api/admin/transport/rides?page=1&status=${status}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
            .then((r) => { setRides(rows<Ride>(r)); setRideMeta(r.meta); })
            .catch((e2) => toast.error(errorMessage(e2, 'Search failed')))
            .finally(() => setLoading(false));
    };

    const toggleFlight = async (f: Flight) => {
        try {
            await api.put(`/api/admin/transport/flights/${f.id}`, { is_active: !f.is_active });
            setFlights(flights.map((x) => (x.id === f.id ? { ...x, is_active: !x.is_active } : x)));
            toast.success(`Flight ${!f.is_active ? 'activated' : 'deactivated'}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        }
    };

    const flightColumns: Column<Flight>[] = [
        { key: 'flight', header: 'Flight', render: (f) => (<span className="font-medium dark:text-white">{f.flight_number} - {f.airline}</span>) },
        { key: 'route', header: 'Route', render: (f) => (<span>{f.origin_city} - {f.destination_city}</span>) },
        { key: 'price', header: 'Price', render: (f) => (<span className="font-semibold">{formatCurrency(Number(f.price))}</span>) },
        { key: 'seats', header: 'Seats', accessor: 'seats_available' },
        {
            key: 'status',
            header: 'Status',
            render: (f) => (
                <span className={`rounded-full px-2 py-1 text-xs ${f.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {f.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (f) => (
                <button onClick={() => toggleFlight(f)} title={f.is_active ? 'Deactivate' : 'Activate'}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                    <Power className="h-3 w-3" /> {f.is_active ? 'Disable' : 'Enable'}
                </button>
            ),
        },
    ];

    const rideColumns: Column<Ride>[] = [
        {
            key: 'rider',
            header: 'Rider',
            render: (r) => (
                <div>
                    <p className="font-medium dark:text-white">{r.rider_name ?? '-'}</p>
                    <p className="text-xs text-gray-500">{r.rider_email}</p>
                </div>
            ),
        },
        { key: 'pickup', header: 'Pickup', accessor: 'pickup_address' },
        { key: 'dropoff', header: 'Drop-off', accessor: 'dropoff_address' },
        { key: 'fare', header: 'Fare', render: (r) => (<span className="font-semibold">{formatCurrency(Number(r.fare))}</span>) },
        {
            key: 'distance',
            header: 'Distance',
            render: (r) => (<span className="text-gray-500">{r.distance_km != null ? `${r.distance_km} km` : '-'}</span>),
        },
        {
            key: 'status',
            header: 'Status',
            render: (r) => (
                <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusTone(r.status)}`}>
                    {r.status.replace('_', ' ')}
                </span>
            ),
        },
        { key: 'requested', header: 'Requested', render: (r) => (<span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</span>) },
    ];

    return (
        <AdminLayout title="Transport Management">
            <Head title="Transport Management" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transport Management</h1>
                <div className="flex gap-2">
                    <button onClick={() => setTab('flights')}
                        className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm ${tab === 'flights' ? 'bg-blue-600 text-white' : 'border bg-white dark:bg-gray-800'}`}>
                        <Plane className="h-4 w-4" /> Flights ({flightMeta?.total ?? flights.length})
                    </button>
                    <button onClick={() => setTab('rides')}
                        className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm ${tab === 'rides' ? 'bg-blue-600 text-white' : 'border bg-white dark:bg-gray-800'}`}>
                        <Car className="h-4 w-4" /> Rides ({rideMeta?.total ?? rides.length})
                    </button>
                </div>

                {tab === 'rides' && (
                    <div className="flex flex-wrap items-center gap-2">
                        {['all', 'requested', 'accepted', 'in_progress', 'completed', 'cancelled'].map((s) => (
                            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                        <form onSubmit={searchRides} className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Address or rider..."
                                className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700" />
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : tab === 'flights' ? (
                    <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                        <DataTable columns={flightColumns} data={flights} emptyTitle="No flights" />
                    </div>
                ) : (
                    <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                        <DataTable columns={rideColumns} data={rides} emptyTitle="No rides" />
                    </div>
                )}

                {tab === 'rides' && rideMeta && rideMeta.total > rideMeta.per_page && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {rideMeta.page} · {rideMeta.total} rides</span>
                        <div className="flex gap-2">
                            <button disabled={rideMeta.page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={rideMeta.page * rideMeta.per_page >= rideMeta.total} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
