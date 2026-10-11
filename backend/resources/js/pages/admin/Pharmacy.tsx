import { statusTone } from '@/lib/lifecycle';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { Pill, ClipboardList, FileText, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real medicines row (MedicineController::index). */
interface Medicine {
    id: string;
    name: string;
    generic_name?: string | null;
    category: string;
    price: number;
    requires_prescription: boolean;
    stock_quantity: number;
}

/** Real admin medicine-order row (AdminDomainController::pharmacyOrders). */
interface MedicineOrder {
    id: string;
    order_number: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total_amount: number;
    prescription_url?: string | null;
    created_at: string;
    buyer_name?: string | null;
    buyer_email?: string | null;
    items_count: number;
}

interface Meta {
    page?: number;
    current_page?: number;
    per_page?: number;
    last_page?: number;
    total: number;
}

interface Prescription {
    id: string;
    code: string;
    status: 'active' | 'filled' | 'expired';
    items: { name: string }[];
    notes?: string | null;
    created_at: string;
    patient?: { id: string; name?: string; email?: string } | null;
    doctor?: { full_name: string } | null;
}

type Tab = 'orders' | 'medicines' | 'prescriptions';

export default function AdminPharmacy() {
    const { auth } = usePage().props as unknown as { auth: { roles?: string[] } };
    const isSuper = (auth?.roles ?? []).includes('super_admin');
    // H-D: medicine catalogue management follows the seeded matrix
    // (pharmacy.medicines.manage holders), not super-admin-only.
    const canManageMeds = isSuper
        || (auth?.roles ?? []).includes('administrator')
        || (auth?.roles ?? []).includes('pharmacy_admin');

    const [tab, setTab] = useState<Tab>('orders');
    const [orders, setOrders] = useState<MedicineOrder[]>([]);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [showMedForm, setShowMedForm] = useState(false);
    const [savingMed, setSavingMed] = useState(false);
    const [medForm, setMedForm] = useState({ name: '', category: '', price: '', stock: '', requires_prescription: false });

    useEffect(() => {
        setLoading(true);
        if (tab === 'orders') {
            api.get<{ data: MedicineOrder[]; meta: Meta }>(`/api/admin/pharmacy/orders?page=${page}&status=${status}`)
                .then((res) => { setOrders(rows<MedicineOrder>(res)); setMeta(res.meta); })
                .catch((e) => { setOrders([]); toast.error(errorMessage(e, 'Failed to load orders')); })
                .finally(() => setLoading(false));
        } else if (tab === 'prescriptions') {
            api.get<{ data: Prescription[]; meta: Meta }>(`/api/admin/pharmacy/prescriptions?page=${page}&status=${status}`)
                .then((res) => { setPrescriptions(rows<Prescription>(res)); setMeta(res.meta); })
                .catch((e) => { setPrescriptions([]); toast.error(errorMessage(e, 'Failed to load prescriptions')); })
                .finally(() => setLoading(false));
        } else {
            api.get<{ data: Medicine[]; meta: Meta }>(`/api/medicines?page=${page}&per_page=15`)
                .then((res) => { setMedicines(rows<Medicine>(res)); setMeta(res.meta); })
                .catch((e) => { setMedicines([]); toast.error(errorMessage(e, 'Failed to load medicines')); })
                .finally(() => setLoading(false));
        }
    }, [tab, page, status]);

    const list = tab === 'orders' ? orders : tab === 'prescriptions' ? prescriptions : medicines;

    const nextAction = (status: MedicineOrder['status']): string | null => {
        if (status === 'pending') return 'confirm';
        if (status === 'confirmed') return 'process';
        if (status === 'processing') return 'ship';
        if (status === 'shipped') return 'deliver';
        return null;
    };

    const transition = async (order: MedicineOrder, action: string) => {
        try {
            const res = await api.post<{ data: MedicineOrder }>(`/api/admin/pharmacy/orders/${order.id}/${action}`);
            setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: res.data.status } : o)));
            toast.success(`Order ${action}ed.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Transition failed'));
        }
    };

    const submitMedicine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!medForm.name.trim() || !medForm.category.trim()) {
            toast.error('Name and category are required');
            return;
        }
        setSavingMed(true);
        try {
            await api.post('/api/medicines', {
                name: medForm.name.trim(),
                category: medForm.category.trim(),
                price: Number(medForm.price) || 0,
                stock: medForm.stock === '' ? 0 : Number(medForm.stock),
                requires_prescription: medForm.requires_prescription,
            });
            toast.success('Medicine added to the catalogue.');
            setShowMedForm(false);
            setMedForm({ name: '', category: '', price: '', stock: '', requires_prescription: false });
            setPage(1);
            setLoading(true);
            api.get<{ data: Medicine[]; meta: Meta }>('/api/medicines?page=1&per_page=15')
                .then((res) => { setMedicines(rows<Medicine>(res)); setMeta(res.meta); })
                .finally(() => setLoading(false));
        } catch (err) {
            toast.error(errorMessage(err, 'Create failed'));
        } finally {
            setSavingMed(false);
        }
    };

    return (
        <AdminLayout title="Pharmacy">
            <Head title="Pharmacy" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pharmacy Management</h1>
                    <div className="flex items-center gap-2">
                        {!canManageMeds && tab === 'medicines' && (
                            <span className="text-xs text-gray-400">Medicine catalogue editing requires pharmacy management access</span>
                        )}
                        {canManageMeds && tab === 'medicines' && (
                            <button onClick={() => setShowMedForm(!showMedForm)}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                                <Plus className="h-4 w-4" /> New Medicine
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => { setTab('orders'); setPage(1); }}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${tab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        <ClipboardList className="h-4 w-4" /> Orders
                    </button>
                    <button onClick={() => { setTab('medicines'); setPage(1); }}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${tab === 'medicines' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        <Pill className="h-4 w-4" /> Medicines
                    </button>
                    <button onClick={() => { setTab('prescriptions'); setPage(1); setStatus('all'); }}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${tab === 'prescriptions' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        <FileText className="h-4 w-4" /> Prescriptions
                    </button>
                </div>

                {(tab === 'orders' || tab === 'prescriptions') && (
                    <div className="flex flex-wrap gap-2">
                        {(tab === 'orders'
                            ? ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
                            : ['all', 'active', 'filled', 'expired']
                        ).map((s) => (
                            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'medicines' && showMedForm && canManageMeds && (
                    <form onSubmit={submitMedicine} className="space-y-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Add Medicine</h2>
                            <button type="button" onClick={() => setShowMedForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <label className="text-sm">Name *
                                <input required maxLength={255} value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Category *
                                <input required maxLength={100} value={medForm.category} onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                                    placeholder="e.g. antibiotics"
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Price *
                                <input required type="number" min={0} step="0.01" value={medForm.price} onChange={(e) => setMedForm({ ...medForm, price: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Stock
                                <input type="number" min={0} step={1} value={medForm.stock} onChange={(e) => setMedForm({ ...medForm, stock: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="flex items-end gap-2 text-sm">Requires prescription
                                <input type="checkbox" checked={medForm.requires_prescription} onChange={(e) => setMedForm({ ...medForm, requires_prescription: e.target.checked })}
                                    className="mb-2 h-4 w-4" /></label>
                        </div>
                        <button type="submit" disabled={savingMed}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                            {savingMed ? 'Saving...' : 'Add Medicine'}
                        </button>
                    </form>
                )}

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : list.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="mt-4 text-gray-500">Nothing here yet</p>
                    </div>
                ) : tab === 'orders' ? (
                    <DataTable
                        columns={[
                            {
                                key: 'order', header: 'Order', accessor: 'order_number', sortable: true,
                                render: (o) => <span className="font-mono text-xs text-gray-500">{o.order_number}</span>,
                            },
                            {
                                key: 'buyer', header: 'Buyer', accessor: 'buyer_name', sortable: true,
                                render: (o) => (
                                    <>
                                        <p className="font-medium text-gray-900 dark:text-white">{o.buyer_name}</p>
                                        <p className="text-xs text-gray-500">{o.buyer_email}</p>
                                    </>
                                ),
                            },
                            { key: 'items', header: 'Items', accessor: 'items_count', sortable: true },
                            {
                                key: 'total', header: 'Total', accessor: 'total_amount', sortable: true,
                                render: (o) => <span className="font-semibold">{formatCurrency(Number(o.total_amount))}</span>,
                            },
                            {
                                key: 'rx', header: 'Rx',
                                render: (o) => (o.prescription_url
                                    ? <a href={o.prescription_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">View</a>
                                    : <span className="text-gray-400">—</span>),
                            },
                            {
                                key: 'status', header: 'Status', accessor: 'status', sortable: true,
                                render: (o) => (
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(o.status)}`}>{o.status}</span>
                                ),
                            },
                            {
                                key: 'placed', header: 'Placed', accessor: 'created_at', sortable: true,
                                render: (o) => <span className="text-xs text-gray-500">{formatDateTime(o.created_at)}</span>,
                            },
                            {
                                key: 'actions', header: 'Actions',
                                render: (o) => {
                                    const next = nextAction(o.status);
                                    const cancellable = o.status === 'pending' || o.status === 'confirmed';
                                    if (!next && !cancellable) return <span className="text-xs text-gray-400">Done</span>;
                                    return (
                                        <div className="flex gap-1.5">
                                            {next && (
                                                <button onClick={() => transition(o, next)}
                                                    className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold capitalize text-white hover:bg-blue-500">
                                                    {next}
                                                </button>
                                            )}
                                            {cancellable && (
                                                <button onClick={() => transition(o, 'cancel')}
                                                    className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    );
                                },
                            },
                        ]}
                        data={orders}
                        loading={false}
                        emptyTitle="Nothing here yet"
                    />
                ) : tab === 'prescriptions' ? (
                    <DataTable
                        columns={[
                            {
                                key: 'code', header: 'Code', accessor: 'code', sortable: true,
                                render: (p) => <span className="font-mono text-xs text-gray-500">{p.code}</span>,
                            },
                            {
                                key: 'patient', header: 'Patient',
                                render: (p) => (
                                    <>
                                        <p className="font-medium text-gray-900 dark:text-white">{p.patient?.name ?? '—'}</p>
                                        <p className="text-xs text-gray-500">{p.patient?.email}</p>
                                    </>
                                ),
                            },
                            {
                                key: 'doctor', header: 'Doctor',
                                render: (p) => <span className="text-sm text-gray-700 dark:text-gray-300">{p.doctor?.full_name ?? '—'}</span>,
                            },
                            {
                                key: 'items', header: 'Items',
                                render: (p) => (
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {p.items.map((it) => it.name).join(', ')}
                                    </span>
                                ),
                            },
                            {
                                key: 'status', header: 'Status', accessor: 'status', sortable: true,
                                render: (p) => (
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(p.status)}`}>{p.status}</span>
                                ),
                            },
                            {
                                key: 'issued', header: 'Issued', accessor: 'created_at', sortable: true,
                                render: (p) => <span className="text-xs text-gray-500">{formatDateTime(p.created_at)}</span>,
                            },
                        ]}
                        data={prescriptions}
                        loading={false}
                        emptyTitle="No prescriptions yet"
                    />
                ) : (
                    <DataTable
                        columns={[
                            {
                                key: 'medicine', header: 'Medicine', accessor: 'name', sortable: true,
                                render: (m) => (
                                    <>
                                        <p className="font-medium text-gray-900 dark:text-white">{m.name}</p>
                                        <p className="text-xs text-gray-500">{m.generic_name}</p>
                                    </>
                                ),
                            },
                            { key: 'category', header: 'Category', accessor: 'category', sortable: true },
                            {
                                key: 'price', header: 'Price', accessor: 'price', sortable: true,
                                render: (m) => <span className="font-semibold">{formatCurrency(Number(m.price))}</span>,
                            },
                            {
                                key: 'stock', header: 'Stock', accessor: 'stock_quantity', sortable: true,
                                render: (m) => (
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.stock_quantity <= 10 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                        {m.stock_quantity}
                                    </span>
                                ),
                            },
                            {
                                key: 'rx', header: 'Prescription',
                                render: (m) => <>{m.requires_prescription ? 'Required' : 'OTC'}</>,
                            },
                        ]}
                        data={medicines}
                        loading={false}
                        emptyTitle="Nothing here yet"
                    />
                )}

                {meta && (meta.total > (meta.per_page ?? 15)) && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.page ?? meta.current_page} · {meta.total} records</span>
                        <div className="flex gap-2">
                            <button disabled={(meta.page ?? meta.current_page ?? 1) <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={(meta.page ?? meta.current_page ?? 1) * (meta.per_page ?? 15) >= meta.total} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
