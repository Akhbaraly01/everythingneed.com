import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Home, Plus, Power, Search } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real admin property row (AdminDomainController::properties). */
interface Property {
    id: string;
    title: string;
    property_type: string;
    price: number;
    currency: string;
    city: string;
    country: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    is_active: boolean;
    is_featured?: boolean;
    created_at: string;
    owner_name?: string | null;
    owner_email?: string | null;
}

interface Meta {
    page: number;
    per_page: number;
    total: number;
}

export default function AdminRealEstate() {
    const [items, setItems] = useState<Property[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', property_type: 'apartment', listing_type: 'sale',
        price: '', address: '', city: '', country: '', bedrooms: '', bathrooms: '',
    });

    const load = (p = page, s = status, q = search) => {
        setLoading(true);
        const qs = new URLSearchParams({ page: String(p), status: s });
        if (q) qs.set('search', q);
        api.get<{ data: Property[]; meta: Meta }>(`/api/admin/properties?${qs}`)
            .then((res) => { setItems(rows<Property>(res)); setMeta(res.meta); })
            .catch((e) => { setItems([]); toast.error(errorMessage(e, 'Failed to load properties')); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(page, status, ''); }, [status, page]); // eslint-disable-line react-hooks/exhaustive-deps

    const searchNow = (e: FormEvent) => {
        e.preventDefault();
        setPage(1);
        load(1, status, search);
    };

    const toggle = async (p: Property) => {
        try {
            await api.put(`/api/admin/properties/${p.id}`, { is_active: !p.is_active });
            setItems(items.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
            toast.success(`Property ${!p.is_active ? 'activated' : 'deactivated'}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        }
    };

    const submitCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/api/admin/properties', {
                ...form,
                price: Number(form.price),
                bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
                bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
            });
            toast.success('Property listed — it is live in listings and search.');
            setForm({ title: '', description: '', property_type: 'apartment', listing_type: 'sale', price: '', address: '', city: '', country: '', bedrooms: '', bathrooms: '' });
            setShowForm(false);
            setPage(1);
            load(1, status, '');
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to create property'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout title="Real Estate">
            <Head title="Real Estate" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Real Estate Listings</h1>
                    <div className="flex items-center gap-3">
                        {meta && <span className="text-sm text-gray-500">{meta.total} properties</span>}
                        <button onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                            <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add property'}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <form onSubmit={submitCreate} className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">New listing</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Title
                                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Property type
                                <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700">
                                    <option value="apartment">Apartment</option>
                                    <option value="house">House</option>
                                    <option value="condo">Condo</option>
                                    <option value="land">Land</option>
                                    <option value="commercial">Commercial</option>
                                </select>
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Listing type
                                <select value={form.listing_type} onChange={(e) => setForm({ ...form, listing_type: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700">
                                    <option value="sale">For sale</option>
                                    <option value="rent">For rent</option>
                                </select>
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Price
                                <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
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
                            <div className="grid grid-cols-2 gap-4">
                                <label className="text-sm text-gray-600 dark:text-gray-300">Bedrooms
                                    <input type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Bathrooms
                                    <input type="number" min="0" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                            </div>
                            <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2 lg:col-span-3">Description
                                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button type="submit" disabled={saving}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                                {saving ? 'Creating...' : 'Create listing'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    {['all', 'active', 'inactive'].map((s) => (
                        <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {s}
                        </button>
                    ))}
                    <form onSubmit={searchNow} className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, city or owner..."
                            className="w-64 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700" />
                    </form>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : items.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Home className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No properties found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Property</th>
                                    <th className="px-4 py-3">Owner</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {items.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{p.title}</p>
                                            <p className="text-xs uppercase text-gray-500">{p.property_type} · {p.bedrooms ?? '—'} bd / {p.bathrooms ?? '—'} ba</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-gray-900 dark:text-white">{p.owner_name}</p>
                                            <p className="text-xs text-gray-500">{p.owner_email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{p.city}, {p.country}</td>
                                        <td className="px-4 py-3 font-semibold">{formatCurrency(Number(p.price))}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {p.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => toggle(p)} title={p.is_active ? 'Deactivate' : 'Activate'}
                                                className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                                <Power className="h-3 w-3" /> {p.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {meta && meta.total > meta.per_page && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.page} · {meta.total} properties</span>
                        <div className="flex gap-2">
                            <button disabled={meta.page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.page * meta.per_page >= meta.total} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
