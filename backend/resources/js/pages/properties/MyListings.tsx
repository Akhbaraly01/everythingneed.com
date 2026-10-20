import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Building2, Plus, CalendarCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

interface Property {
    id: string;
    title: string;
    property_type: string;
    listing_type?: string;
    price: number;
    city: string;
}

interface ViewingRequest {
    id: string;
    status: string;
    viewing_date?: string | null;
    viewing_time?: string | null;
    message?: string | null;
    created_at: string;
    user?: { name?: string; email?: string } | null;
}

export default function MyListings() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const [viewings, setViewings] = useState<Record<string, ViewingRequest[]>>({});
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Property[] }>('/api/properties/my-listings')
            .then((res) => setProperties(Array.isArray(res.data) ? res.data : []))
            .catch((e) => setError(errorMessage(e, 'Failed to load your listings')))
            .finally(() => setLoading(false));
    }, []);

    const toggleViewings = (id: string) => {
        if (openId === id) {
            setOpenId(null);
            return;
        }
        setOpenId(id);
        if (viewings[id]) return;
        api.get<{ data: ViewingRequest[] }>(`/api/properties/${id}/viewing-requests`)
            .then((res) => setViewings((v) => ({ ...v, [id]: Array.isArray(res.data) ? res.data : [] })))
            .catch((e) => {
                setViewings((v) => ({ ...v, [id]: [] }));
                toast.error(errorMessage(e, 'Failed to load viewing requests'));
            });
    };

    const act = async (propertyId: string, viewingId: string, action: 'approve' | 'reject') => {
        setBusyId(viewingId);
        try {
            await api.post(`/api/properties/viewing-requests/${viewingId}/${action}`);
            toast.success(action === 'approve' ? 'Viewing approved' : 'Viewing rejected');
            const res = await api.get<{ data: ViewingRequest[] }>(`/api/properties/${propertyId}/viewing-requests`);
            setViewings((v) => ({ ...v, [propertyId]: Array.isArray(res.data) ? res.data : [] }));
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <AppLayout title="My Listings">
            <Head title="My Listings" />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Listings</h1>
                    <Link href="/real-estate/create" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                        <Plus className="h-4 w-4" /> List a property
                    </Link>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading your listings...</p>
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">{error}</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">You have not listed any property yet.</p>
                    </div>
                ) : (
                    <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                        {properties.map((property) => (
                            <div key={property.id}>
                                <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <Link href={`/real-estate/${property.id}`} className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{property.title}</p>
                                        <p className="text-xs capitalize text-gray-500">
                                            {property.listing_type ?? 'sale'} · {property.property_type} · {property.city}
                                        </p>
                                    </Link>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold">{formatPrice(property.price)}</span>
                                        <button
                                            onClick={() => toggleViewings(property.id)}
                                            aria-label="Toggle viewing requests"
                                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            <CalendarCheck className="h-4 w-4" />
                                            {openId === property.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                {openId === property.id && (
                                    <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-700">
                                        {!viewings[property.id] ? (
                                            <p className="text-sm text-gray-500">Loading viewing requests...</p>
                                        ) : viewings[property.id].length === 0 ? (
                                            <p className="text-sm text-gray-500">No viewing requests for this listing yet.</p>
                                        ) : (
                                            <ul className="space-y-3">
                                                {viewings[property.id].map((v) => (
                                                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3 dark:border-gray-700">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {v.user?.name ?? 'Requester'}
                                                                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                                                                    v.status === 'approved' ? 'bg-green-100 text-green-800'
                                                                    : v.status === 'rejected' ? 'bg-red-100 text-red-700'
                                                                    : 'bg-amber-100 text-amber-800'}`}>
                                                                    {v.status}
                                                                </span>
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {v.viewing_date ? `${v.viewing_date}${v.viewing_time ? ` at ${v.viewing_time}` : ''}` : 'No slot requested'}
                                                                {v.user?.email ? ` · ${v.user.email}` : ''}
                                                            </p>
                                                            {v.message && <p className="mt-1 text-xs text-gray-500">{v.message}</p>}
                                                        </div>
                                                        {v.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => act(property.id, v.id, 'approve')}
                                                                    disabled={busyId === v.id}
                                                                    className="rounded-lg border border-green-200 px-3 py-1 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-green-900"
                                                                >Approve</button>
                                                                <button
                                                                    onClick={() => act(property.id, v.id, 'reject')}
                                                                    disabled={busyId === v.id}
                                                                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900"
                                                                >Reject</button>
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
