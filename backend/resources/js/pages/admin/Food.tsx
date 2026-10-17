import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { FormEvent, useEffect, useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import { UtensilsCrossed, Star, Plus, Power, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm';

interface Restaurant {
    id: string;
    name: string;
    cuisine_type: string;
    city: string;
    rating: number;
    is_active: boolean;
    address?: string;
    phone?: string | null;
    description?: string | null;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

export default function AdminFood() {
    const confirm = useConfirm();
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

    // Edit dialog (full profile incl. the active switch).
    const [editRestaurant, setEditRestaurant] = useState<Restaurant | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '', cuisine_type: '', address: '', city: '', phone: '', description: '', is_active: true,
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

    const openEdit = (r: Restaurant) => {
        setEditRestaurant(r);
        setEditForm({
            name: r.name,
            cuisine_type: r.cuisine_type,
            address: r.address ?? '',
            city: r.city,
            phone: r.phone ?? '',
            description: r.description ?? '',
            is_active: r.is_active,
        });
    };

    const saveEdit = async () => {
        if (!editRestaurant) return;
        if (!editForm.name.trim() || !editForm.cuisine_type.trim() || !editForm.address.trim() || !editForm.city.trim()) {
            toast.error('Name, cuisine, address and city are required.');
            return;
        }
        setEditSaving(true);
        try {
            await api.put(`/api/admin/restaurants/${editRestaurant.id}`, {
                name: editForm.name.trim(),
                cuisine_type: editForm.cuisine_type.trim(),
                address: editForm.address.trim(),
                city: editForm.city.trim(),
                phone: editForm.phone || null,
                description: editForm.description || null,
                is_active: editForm.is_active,
            });
            toast.success(`${editForm.name.trim()} updated.`);
            setEditRestaurant(null);
            setTick((t) => t + 1);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to update restaurant'));
        } finally {
            setEditSaving(false);
        }
    };

    const deleteRestaurant = async (r: Restaurant) => {
        const ok = await confirm({
            title: `Delete ${r.name}?`,
            description: 'The restaurant is removed from listings. Restaurants with orders cannot be deleted — deactivate instead.',
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        try {
            await api.del(`/api/admin/restaurants/${r.id}`);
            toast.success(`${r.name} deleted.`);
            setTick((t) => t + 1);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to delete restaurant'));
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
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggle(r)} title={r.is_active ? 'Deactivate' : 'Activate'}
                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                        <Power className="h-3 w-3" /> {r.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                    <button onClick={() => openEdit(r)} title="Edit restaurant" data-testid={`restaurant-edit-${r.id}`}
                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-gray-600">
                                        <Pencil className="h-3 w-3" /> Edit
                                    </button>
                                    <button onClick={() => void deleteRestaurant(r)} title="Delete restaurant" data-testid={`restaurant-delete-${r.id}`}
                                        className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800">
                                        <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    data={restaurants}
                    loading={loading}
                    emptyTitle="No restaurants"
                />

                {editRestaurant && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" data-testid="restaurant-edit-modal">
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Edit restaurant</h2>
                                    <p className="text-xs text-gray-500">{editRestaurant.city}</p>
                                </div>
                                <button onClick={() => setEditRestaurant(null)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm text-gray-600 dark:text-gray-300">Name
                                    <input data-testid="restaurant-edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Cuisine
                                    <input data-testid="restaurant-edit-cuisine" value={editForm.cuisine_type} onChange={(e) => setEditForm({ ...editForm, cuisine_type: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Address
                                    <input data-testid="restaurant-edit-address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">City
                                    <input data-testid="restaurant-edit-city" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Phone
                                    <input data-testid="restaurant-edit-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Description
                                    <textarea data-testid="restaurant-edit-description" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">
                                    <input data-testid="restaurant-edit-active" type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                                    Active (visible in listings and search)
                                </label>
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button onClick={() => setEditRestaurant(null)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                    Cancel
                                </button>
                                <button onClick={() => void saveEdit()} disabled={editSaving} data-testid="restaurant-edit-save"
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
