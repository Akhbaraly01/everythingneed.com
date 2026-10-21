import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useConfirm } from '@/lib/confirm';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthPermissions } from '@/lib/permissions';
import { Home, Pencil, Plus, Power, Search, Trash2 } from 'lucide-react';
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

interface EditForm {
    title: string;
    property_type: string;
    price: string;
    currency: string;
    city: string;
    country: string;
    bedrooms: string;
    bathrooms: string;
    is_featured: boolean;
}

export default function AdminRealEstate() {
    const ask = useConfirm();
    const { can, roles } = useAuthPermissions();
    const canManage = can('real_estate.overview.manage');
    const canCreate = canManage
        && (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('building_admin') || roles.includes('real_estate_admin'));
    const [items, setItems] = useState<Property[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<Property | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({
        title: '', property_type: 'apartment', price: '', currency: 'USD',
        city: '', country: '', bedrooms: '', bathrooms: '', is_featured: false,
    });
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

    const openEdit = (p: Property) => {
        setEditing(p);
        setEditForm({
            title: p.title,
            property_type: p.property_type,
            price: String(p.price),
            currency: p.currency ?? 'USD',
            city: p.city ?? '',
            country: p.country ?? '',
            bedrooms: p.bedrooms != null ? String(p.bedrooms) : '',
            bathrooms: p.bathrooms != null ? String(p.bathrooms) : '',
            is_featured: Boolean(p.is_featured),
        });
    };

    const saveEdit = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            await api.put(`/api/admin/properties/${editing.id}`, {
                title: editForm.title,
                property_type: editForm.property_type,
                price: Number(editForm.price),
                currency: editForm.currency,
                city: editForm.city,
                country: editForm.country,
                bedrooms: editForm.bedrooms === '' ? null : Number(editForm.bedrooms),
                bathrooms: editForm.bathrooms === '' ? null : Number(editForm.bathrooms),
                is_featured: editForm.is_featured,
            });
            setItems(items.map((x) => (x.id === editing.id ? {
                ...x,
                ...editForm,
                price: Number(editForm.price),
                bedrooms: editForm.bedrooms === '' ? null : Number(editForm.bedrooms),
                bathrooms: editForm.bathrooms === '' ? null : Number(editForm.bathrooms),
            } : x)));
            toast.success('Listing updated.');
            setEditing(null);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (p: Property) => {
        const ok = await ask({
            title: 'Delete listing',
            description: `Remove "${p.title}" from the marketplace? The listing is soft-deleted and can be restored in the database if needed.`,
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        try {
            await api.del(`/api/admin/properties/${p.id}`);
            setItems(items.filter((x) => x.id !== p.id));
            toast.success('Listing removed.');
        } catch (e) {
            toast.error(errorMessage(e, 'Delete failed'));
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
                        {canCreate && (
                            <button onClick={() => setShowForm(!showForm)}
                                className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                                <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add property'}
                            </button>
                        )}
                    </div>
                </div>

                {canCreate && showForm && (
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
                                            {canManage ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => toggle(p)} title={p.is_active ? 'Deactivate' : 'Activate'} data-testid={`property-toggle-${p.id}`}
                                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                                        <Power className="h-3 w-3" /> {p.is_active ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button onClick={() => openEdit(p)} title="Edit listing" data-testid={`property-edit-${p.id}`}
                                                        className="rounded-lg border border-gray-300 p-1.5 text-blue-600 hover:bg-blue-50 dark:border-gray-600 dark:text-blue-400">
                                                        <Pencil className="h-3 w-3" />
                                                    </button>
                                                    <button onClick={() => remove(p)} title="Delete listing" data-testid={`property-delete-${p.id}`}
                                                        className="rounded-lg border border-gray-300 p-1.5 text-red-600 hover:bg-red-50 dark:border-gray-600 dark:text-red-400">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">View only</span>
                                            )}
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

                {canManage && editing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" data-testid="property-edit-modal">
                        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit listing</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Title
                                    <input value={editForm.title} data-testid="property-edit-title"
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Property type
                                    <select value={editForm.property_type} data-testid="property-edit-type"
                                        onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700">
                                        {['apartment', 'house', 'condo', 'land', 'commercial'].map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Price
                                    <input type="number" min="0" step="0.01" value={editForm.price} data-testid="property-edit-price"
                                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Currency
                                    <input value={editForm.currency} maxLength={3} data-testid="property-edit-currency"
                                        onChange={(e) => setEditForm({ ...editForm, currency: e.target.value.toUpperCase() })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">City
                                    <input value={editForm.city} data-testid="property-edit-city"
                                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Country
                                    <input value={editForm.country} data-testid="property-edit-country"
                                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Bedrooms
                                    <input type="number" min="0" value={editForm.bedrooms} data-testid="property-edit-bedrooms"
                                        onChange={(e) => setEditForm({ ...editForm, bedrooms: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Bathrooms
                                    <input type="number" min="0" value={editForm.bathrooms} data-testid="property-edit-bathrooms"
                                        onChange={(e) => setEditForm({ ...editForm, bathrooms: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">
                                    <input type="checkbox" checked={editForm.is_featured} data-testid="property-edit-featured"
                                        onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })} />
                                    Featured listing
                                </label>
                            </div>
                            <div className="mt-5 flex justify-end gap-2">
                                <button onClick={() => setEditing(null)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300">Cancel</button>
                                <button onClick={() => void saveEdit()} disabled={saving} data-testid="property-edit-save"
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                                    {saving ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
