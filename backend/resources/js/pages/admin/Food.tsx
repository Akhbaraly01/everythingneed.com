import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { FormEvent, useEffect, useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import { UtensilsCrossed, Star, Plus, Power } from 'lucide-react';
import { toast } from 'sonner';

interface Restaurant {
    id: string;
    name: string;
    cuisine_type: string;
    city: string;
    rating: number;
    is_active: boolean;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

export default function AdminFood() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [tick, setTick] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', cuisine_type: '', address: '', city: '', phone: '', description: '',
    });

    useEffect(() => {
        setLoading(true);
        api.get<{ data: Restaurant[]; meta: Meta }>(`/api/admin/restaurants?page=${page}&status=${status}&per_page=25`)
            .then((res) => {
                setRestaurants(rows<Restaurant>(res));
                setMeta(res.meta);
            })
            .catch((e) => {
                setRestaurants([]);
                toast.error(errorMessage(e, 'Failed to load restaurants'));
            })
            .finally(() => setLoading(false));
    }, [status, page, tick]);

    const submitCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/api/admin/restaurants', form);
            toast.success('Restaurant created — it is live in listings and search.');
            setForm({ name: '', cuisine_type: '', address: '', city: '', phone: '', description: '' });
            setShowForm(false);
            setPage(1);
            setTick((t) => t + 1);
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to create restaurant'));
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (r: Restaurant) => {
        try {
            await api.put(`/api/admin/restaurants/${r.id}`, { is_active: !r.is_active });
            setRestaurants(restaurants.map((x) => (x.id === r.id ? { ...x, is_active: !x.is_active } : x)));
            toast.success(`Restaurant ${!r.is_active ? 'activated' : 'deactivated'}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        }
    };

    return (
        <AdminLayout title="Restaurant Management">
            <Head title="Restaurant Management" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><UtensilsCrossed className="h-6 w-6" /> Restaurant Management</h1>
                    <div className="flex items-center gap-3">
                        {meta && <span className="text-sm text-gray-500">{meta.total} restaurants</span>}
                        <button onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                            <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add restaurant'}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <form onSubmit={submitCreate} className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">New restaurant</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <label className="text-sm text-gray-600 dark:text-gray-300">Name
                                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Cuisine
                                <input required value={form.cuisine_type} placeholder="e.g. Italian" onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">City
                                <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Address
                                <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Phone
                                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2 lg:col-span-3">Description
                                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button type="submit" disabled={saving}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                                {saving ? 'Creating...' : 'Create restaurant'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as const).map((s) => (
                        <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {s}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        { key: 'name', header: 'Restaurant', accessor: 'name', sortable: true },
                        { key: 'cuisine', header: 'Cuisine', accessor: 'cuisine_type', sortable: true },
                        {
                            key: 'city', header: 'City', accessor: 'city', sortable: true,
                            render: (r) => <span className="text-gray-500">{r.city}</span>,
                        },
                        {
                            key: 'rating', header: 'Rating', accessor: 'rating', sortable: true,
                            render: (r) => (
                                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400" />{r.rating || 'New'}</span>
                            ),
                        },
                        {
                            key: 'status', header: 'Status',
                            render: (r) => (
                                <span className={`rounded-full px-2 py-1 text-xs ${r.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.is_active ? 'Active' : 'Inactive'}</span>
                            ),
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (r) => (
                                <button onClick={() => toggle(r)} title={r.is_active ? 'Deactivate' : 'Activate'}
                                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                    <Power className="h-3 w-3" /> {r.is_active ? 'Disable' : 'Enable'}
                                </button>
                            ),
                        },
                    ]}
                    data={restaurants}
                    loading={loading}
                    emptyTitle="No restaurants"
                />

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.current_page} of {meta.last_page}</span>
                        <div className="flex gap-2">
                            <button disabled={meta.current_page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
