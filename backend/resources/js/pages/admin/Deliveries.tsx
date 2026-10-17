import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useConfirm } from '@/lib/confirm';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { Pencil, Star, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real delivery manager row (DeliveryController::index). */
interface DeliveryManager {
    id: string;
    full_name: string;
    phone?: string | null;
    vehicle_type?: string | null;
    is_available: boolean;
    completed_deliveries: number;
    rating: number;
    created_at: string;
}

interface Meta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface EditForm {
    full_name: string;
    phone: string;
    vehicle_type: string;
}

export default function AdminDeliveries() {
    const confirm = useConfirm();
    const [managers, setManagers] = useState<DeliveryManager[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [avail, setAvail] = useState('all');
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState<DeliveryManager | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({ full_name: '', phone: '', vehicle_type: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        const qs = new URLSearchParams({ page: String(page), per_page: '15' });
        if (avail === 'available') qs.set('is_available', '1');
        if (avail === 'unavailable') qs.set('is_available', '0');
        api.get<{ data: DeliveryManager[]; meta: Meta }>(`/api/delivery/managers?${qs}`)
            .then((res) => { setManagers(rows<DeliveryManager>(res)); setMeta(res.meta); })
            .catch((e) => { setManagers([]); toast.error(errorMessage(e, 'Failed to load delivery managers')); })
            .finally(() => setLoading(false));
    }, [avail, page]);

    const toggle = async (m: DeliveryManager) => {
        try {
            await api.put(`/api/delivery/managers/${m.id}`, { is_available: !m.is_available });
            setManagers(managers.map((x) => (x.id === m.id ? { ...x, is_available: !x.is_available } : x)));
            toast.success(`${m.full_name} is now ${!m.is_available ? 'available' : 'unavailable'}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        }
    };

    const openEdit = (m: DeliveryManager) => {
        setEditing(m);
        setEditForm({ full_name: m.full_name, phone: m.phone ?? '', vehicle_type: m.vehicle_type ?? '' });
    };

    const saveEdit = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            const res = await api.put<{ data: DeliveryManager }>(`/api/delivery/managers/${editing.id}`, editForm);
            setManagers(managers.map((x) => (x.id === editing.id ? { ...x, ...editForm, ...(res?.data ?? {}) } : x)));
            toast.success('Delivery manager updated.');
            setEditing(null);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (m: DeliveryManager) => {
        const ok = await confirm({
            title: 'Delete delivery manager',
            description: `Remove ${m.full_name} from the delivery roster?`,
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        try {
            await api.delete(`/api/delivery/managers/${m.id}`);
            setManagers(managers.filter((x) => x.id !== m.id));
            toast.success(`${m.full_name} removed.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Delete failed - managers with delivery assignments cannot be removed'));
        }
    };

    return (
        <AdminLayout title="Deliveries">
            <Head title="Deliveries" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Managers</h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} managers</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                    {['all', 'available', 'unavailable'].map((a) => (
                        <button key={a} onClick={() => { setAvail(a); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium ${avail === a ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {a}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        { key: 'name', header: 'Name', accessor: 'full_name', sortable: true },
                        {
                            key: 'phone', header: 'Phone',
                            render: (m) => <span className="text-gray-700 dark:text-gray-300">{m.phone ?? '—'}</span>,
                        },
                        {
                            key: 'vehicle', header: 'Vehicle', accessor: 'vehicle_type', sortable: true,
                            render: (m) => <span className="text-gray-700 dark:text-gray-300">{m.vehicle_type ?? '—'}</span>,
                        },
                        { key: 'completed', header: 'Completed', accessor: 'completed_deliveries', sortable: true },
                        {
                            key: 'rating', header: 'Rating', accessor: 'rating', sortable: true,
                            render: (m) => (
                                <span className="flex items-center gap-1 text-amber-500">
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{Number(m.rating).toFixed(1)}</span>
                                </span>
                            ),
                        },
                        {
                            key: 'available', header: 'Available',
                            render: (m) => (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {m.is_available ? 'Available' : 'Off'}
                                </span>
                            ),
                        },
                        {
                            key: 'joined', header: 'Joined', accessor: 'created_at', sortable: true,
                            render: (m) => <span className="text-xs text-gray-500">{formatDateTime(m.created_at)}</span>,
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (m) => (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => toggle(m)} title="Toggle availability" data-testid={`delivery-toggle-${m.id}`}
                                        className={`rounded p-1 ${m.is_available ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                                        {m.is_available ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                    </button>
                                    <button onClick={() => openEdit(m)} title="Edit manager" data-testid={`delivery-edit-${m.id}`}
                                        className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400">
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => remove(m)} title="Delete manager" data-testid={`delivery-delete-${m.id}`}
                                        className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    data={managers}
                    loading={loading}
                    emptyTitle="No delivery managers found"
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

                {editing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" data-testid="delivery-edit-modal">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit delivery manager</h2>
                            <div className="mt-4 space-y-3">
                                <label className="block text-sm text-gray-600 dark:text-gray-300">
                                    Full name
                                    <input value={editForm.full_name} data-testid="delivery-edit-name"
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="block text-sm text-gray-600 dark:text-gray-300">
                                    Phone
                                    <input value={editForm.phone} data-testid="delivery-edit-phone"
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="block text-sm text-gray-600 dark:text-gray-300">
                                    Vehicle
                                    <input value={editForm.vehicle_type} data-testid="delivery-edit-vehicle"
                                        onChange={(e) => setEditForm({ ...editForm, vehicle_type: e.target.value })}
                                        placeholder="motorbike, van, car…"
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                            </div>
                            <div className="mt-5 flex justify-end gap-2">
                                <button onClick={() => setEditing(null)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600">Cancel</button>
                                <button onClick={() => void saveEdit()} disabled={saving} data-testid="delivery-edit-save"
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
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
