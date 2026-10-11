import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { FormEvent, useEffect, useState } from 'react';
import { Hotel, MapPin, Plus, Power } from 'lucide-react';
import { toast } from 'sonner';

interface HotelItem {
    id: string;
    name: string;
    city: string;
    country: string;
    star_rating: number;
    is_active: boolean;
    rooms_count?: number;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

export default function AdminHotels() {
    const [hotels, setHotels] = useState<HotelItem[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [tick, setTick] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', address: '', city: '', country: '', state: '', phone: '', email: '',
        star_rating: '', description: '',
    });

    useEffect(() => {
        setLoading(true);
        api.get<{ data: HotelItem[]; meta: Meta }>(`/api/admin/hotels?page=${page}&status=${status}&per_page=25`)
            .then((res) => {
                setHotels(rows<HotelItem>(res));
                setMeta(res.meta);
            })
            .catch((e) => {
                setHotels([]);
                toast.error(errorMessage(e, 'Failed to load hotels'));
            })
            .finally(() => setLoading(false));
    }, [status, page, tick]);

    const submitCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/api/admin/hotels', {
                ...form,
                star_rating: form.star_rating ? Number(form.star_rating) : null,
            });
            toast.success('Hotel created — it is live in listings and search.');
            setForm({ name: '', address: '', city: '', country: '', state: '', phone: '', email: '', star_rating: '', description: '' });
            setShowForm(false);
            setPage(1);
            setTick((t) => t + 1);
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to create hotel'));
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (h: HotelItem) => {
        try {
            await api.put(`/api/admin/hotels/${h.id}`, { is_active: !h.is_active });
            setHotels(hotels.map((x) => (x.id === h.id ? { ...x, is_active: !x.is_active } : x)));
            toast.success(`Hotel ${!h.is_active ? 'activated' : 'deactivated'}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        }
    };

    return (
        <AdminLayout title="Hotel Management">
            <Head title="Hotel Management" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Hotel className="h-6 w-6" /> Hotel Management</h1>
                    <div className="flex items-center gap-3">
                        {meta && <span className="text-sm text-gray-500">{meta.total} hotels</span>}
                        <button onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                            <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add hotel'}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <form onSubmit={submitCreate} className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">New hotel</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <label className="text-sm text-gray-600 dark:text-gray-300">Name
                                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Address
                                <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">City
                                <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Country
                                <input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">State
                                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Phone
                                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Email
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Stars (1-5)
                                <input type="number" min="1" max="5" value={form.star_rating} onChange={(e) => setForm({ ...form, star_rating: e.target.value })}
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
                                {saving ? 'Creating...' : 'Create hotel'}
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

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Hotel</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Rating</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {hotels.map((h) => (
                                    <tr key={h.id}>
                                        <td className="px-4 py-3 font-medium dark:text-white">{h.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{h.city}, {h.country}</td>
                                        <td className="px-4 py-3 text-amber-500">{'★'.repeat(h.star_rating || 0)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-1 text-xs ${h.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {h.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => toggle(h)} title={h.is_active ? 'Deactivate' : 'Activate'}
                                                className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                                <Power className="h-3 w-3" /> {h.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {hotels.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No hotels</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

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
