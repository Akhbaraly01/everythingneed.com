import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { FormEvent, useEffect, useState } from 'react';
import { Hotel, MapPin, Pencil, Plus, Power, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm';
import { useAuthPermissions } from '@/lib/permissions';

interface HotelItem {
    id: string;
    name: string;
    city: string;
    country: string;
    star_rating: number;
    is_active: boolean;
    rooms_count?: number;
    address?: string;
    state?: string | null;
    phone?: string | null;
    email?: string | null;
    description?: string | null;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

export default function AdminHotels() {
    const ask = useConfirm();
    const { can, roles } = useAuthPermissions();
    const canManage = can('hotels.overview.manage')
        && (roles.includes('super_admin') || roles.includes('administrator') || roles.includes('hotel_admin'));
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

    // Edit dialog (full profile incl. the active switch).
    const [editHotel, setEditHotel] = useState<HotelItem | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '', address: '', city: '', country: '', state: '', phone: '', email: '',
        star_rating: '', description: '', is_active: true,
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

    const openEdit = (h: HotelItem) => {
        setEditHotel(h);
        setEditForm({
            name: h.name,
            address: h.address ?? '',
            city: h.city,
            country: h.country,
            state: h.state ?? '',
            phone: h.phone ?? '',
            email: h.email ?? '',
            star_rating: h.star_rating ? String(h.star_rating) : '',
            description: h.description ?? '',
            is_active: h.is_active,
        });
    };

    const saveEdit = async () => {
        if (!editHotel) return;
        if (!editForm.name.trim() || !editForm.address.trim() || !editForm.city.trim() || !editForm.country.trim()) {
            toast.error('Name, address, city and country are required.');
            return;
        }
        setEditSaving(true);
        try {
            await api.put(`/api/admin/hotels/${editHotel.id}`, {
                name: editForm.name.trim(),
                address: editForm.address.trim(),
                city: editForm.city.trim(),
                country: editForm.country.trim(),
                state: editForm.state || null,
                phone: editForm.phone || null,
                email: editForm.email || null,
                star_rating: editForm.star_rating ? Number(editForm.star_rating) : null,
                description: editForm.description || null,
                is_active: editForm.is_active,
            });
            toast.success(`${editForm.name.trim()} updated.`);
            setEditHotel(null);
            setTick((t) => t + 1);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to update hotel'));
        } finally {
            setEditSaving(false);
        }
    };

    const deleteHotel = async (h: HotelItem) => {
        const ok = await ask({
            title: `Delete ${h.name}?`,
            description: 'The hotel and its rooms are removed. Hotels with reservations cannot be deleted — deactivate instead.',
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        try {
            await api.del(`/api/admin/hotels/${h.id}`);
            toast.success(`${h.name} deleted.`);
            setTick((t) => t + 1);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to delete hotel'));
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
                        {canManage && (
                            <button onClick={() => setShowForm(!showForm)}
                                className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                                <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add hotel'}
                            </button>
                        )}
                    </div>
                </div>

                {canManage && showForm && (
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
                                            {canManage ? (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => toggle(h)} title={h.is_active ? 'Deactivate' : 'Activate'}
                                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                                        <Power className="h-3 w-3" /> {h.is_active ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button onClick={() => openEdit(h)} title="Edit hotel" data-testid={`hotel-edit-${h.id}`}
                                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-gray-600">
                                                        <Pencil className="h-3 w-3" /> Edit
                                                    </button>
                                                    <button onClick={() => void deleteHotel(h)} title="Delete hotel" data-testid={`hotel-delete-${h.id}`}
                                                        className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800">
                                                        <Trash2 className="h-3 w-3" /> Delete
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">View only</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {hotels.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No hotels</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {canManage && editHotel && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" data-testid="hotel-edit-modal">
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Edit hotel</h2>
                                    <p className="text-xs text-gray-500">{editHotel.city}, {editHotel.country}</p>
                                </div>
                                <button onClick={() => setEditHotel(null)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm text-gray-600 dark:text-gray-300">Name
                                    <input data-testid="hotel-edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Stars (1-5)
                                    <input data-testid="hotel-edit-stars" type="number" min="1" max="5" value={editForm.star_rating} onChange={(e) => setEditForm({ ...editForm, star_rating: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Address
                                    <input data-testid="hotel-edit-address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">City
                                    <input data-testid="hotel-edit-city" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Country
                                    <input data-testid="hotel-edit-country" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">State
                                    <input data-testid="hotel-edit-state" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Phone
                                    <input data-testid="hotel-edit-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Email
                                    <input data-testid="hotel-edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Description
                                    <textarea data-testid="hotel-edit-description" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">
                                    <input data-testid="hotel-edit-active" type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                                    Active (visible in listings and search)
                                </label>
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button onClick={() => setEditHotel(null)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                    Cancel
                                </button>
                                <button onClick={() => void saveEdit()} disabled={editSaving} data-testid="hotel-edit-save"
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                                    {editSaving ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </div>
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
