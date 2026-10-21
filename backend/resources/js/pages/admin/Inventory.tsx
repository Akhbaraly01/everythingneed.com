import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { useAuthPermissions } from '@/lib/permissions';
import DataTable from '@/components/shared/DataTable';
import { AlertTriangle, Pencil, Check, X, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real stock_levels row + product (StockController::index). */
interface Stock {
    id: string;
    product_id: string;
    quantity: number;
    reserved_quantity: number;
    reorder_point: number;
    product?: { name?: string | null; sku?: string | null } | null;
}

/** StockMovement row (StockController::movements). */
interface Movement {
    id: string;
    product_id: string;
    type: string;
    quantity: number;
    notes?: string | null;
    created_at: string;
    product?: { name?: string | null } | null;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

export default function AdminInventory() {
    const { can } = useAuthPermissions();
    const canManage = can('inventory.stock.manage');

    const [stocks, setStocks] = useState<Stock[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [lowOnly, setLowOnly] = useState(false);
    const [page, setPage] = useState(1);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [qty, setQty] = useState('');
    const [reorder, setReorder] = useState('');
    const [saving, setSaving] = useState(false);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [showMovements, setShowMovements] = useState(false);

    const loadMovements = () => {
        api.get<{ data: Movement[] }>('/api/stock-movements?per_page=20')
            .then((res) => setMovements(rows<Movement>(res)))
            .catch(() => setMovements([]));
    };

    useEffect(() => {
        if (showMovements) loadMovements();
    }, [showMovements]);

    const load = () => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (lowOnly) params.set('low_stock', '1');
        api.get<{ data: Stock[]; meta: Meta }>(`/api/stock?${params}`)
            .then((res) => {
                setStocks(rows<Stock>(res));
                setMeta(res.meta);
            })
            .catch((e) => {
                setStocks([]);
                toast.error(errorMessage(e, 'Failed to load inventory'));
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, [lowOnly, page]);

    const startEdit = (s: Stock) => {
        setEditingId(s.id);
        setQty(String(s.quantity));
        setReorder(String(s.reorder_point));
    };

    const save = async (id: string) => {
        setSaving(true);
        try {
            const payload = {
                quantity: Math.max(0, parseInt(qty, 10) || 0),
                reorder_point: Math.max(0, parseInt(reorder, 10) || 0),
            };
            await api.put(`/api/stock/${id}`, payload);
            setStocks(stocks.map((s) => (s.id === id ? { ...s, ...payload } : s)));
            setEditingId(null);
            if (showMovements) loadMovements();
            toast.success('Stock updated.');
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        } finally {
            setSaving(false);
        }
    };

    const isLow = (s: Stock) => s.quantity <= s.reorder_point;

    return (
        <AdminLayout title="Inventory">
            <Head title="Inventory" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory / Stock Levels</h1>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={lowOnly} onChange={(e) => { setLowOnly(e.target.checked); setPage(1); }} />
                        Low stock only
                    </label>
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'product', header: 'Product',
                            render: (s) => <span className="font-medium text-gray-900 dark:text-white">{s.product?.name ?? s.product_id}</span>,
                        },
                        {
                            key: 'sku', header: 'SKU',
                            render: (s) => <span className="text-xs text-gray-500">{s.product?.sku ?? '—'}</span>,
                        },
                        {
                            key: 'quantity', header: 'Quantity', accessor: 'quantity', sortable: true,
                            render: (s) => (editingId === s.id ? (
                                <input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)}
                                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            ) : (
                                <span className="font-semibold">{s.quantity}</span>
                            )),
                        },
                        {
                            key: 'reserved', header: 'Reserved', accessor: 'reserved_quantity', sortable: true,
                            render: (s) => <span className="text-gray-500">{s.reserved_quantity}</span>,
                        },
                        {
                            key: 'reorder', header: 'Reorder Point', accessor: 'reorder_point', sortable: true,
                            render: (s) => (editingId === s.id ? (
                                <input type="number" min={0} value={reorder} onChange={(e) => setReorder(e.target.value)}
                                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            ) : (
                                <>{s.reorder_point}</>
                            )),
                        },
                        {
                            key: 'health', header: 'Health',
                            render: (s) => (isLow(s) ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                    <AlertTriangle className="h-3 w-3" /> Low
                                </span>
                            ) : (
                                <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">OK</span>
                            )),
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (s) => (!canManage ? (
                                <span className="text-xs text-gray-400">View only</span>
                            ) : editingId === s.id ? (
                                <div className="flex gap-1.5">
                                    <button onClick={() => save(s.id)} disabled={saving}
                                        className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50"><Check className="h-4 w-4" /></button>
                                    <button onClick={() => setEditingId(null)}
                                        className="rounded p-1 text-gray-500 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                                </div>
                            ) : (
                                <button onClick={() => startEdit(s)} title="Adjust stock"
                                    className="rounded p-1 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
                            )),
                        },
                    ]}
                    data={stocks}
                    loading={loading}
                    emptyTitle="No stock records"
                    emptyDescription="Stock levels appear here once products are inventoried."
                />

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.current_page} of {meta.last_page} · {meta.total} products</span>
                        <div className="flex gap-2">
                            <button disabled={meta.current_page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}

                {/* Audit trail: every quantity change (adjust endpoint or the
                    inline editor) records a StockMovement row. */}
                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                    <button
                        onClick={() => setShowMovements(!showMovements)}
                        className="flex w-full items-center justify-between px-6 py-4 text-left"
                    >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <History className="h-4 w-4" /> Recent stock movements
                        </span>
                        <span className="text-xs text-gray-500">{showMovements ? 'Hide' : 'Show'}</span>
                    </button>
                    {showMovements && (
                        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                            {movements.length === 0 ? (
                                <p className="text-sm text-gray-500">No movements recorded yet.</p>
                            ) : (
                                <div className="divide-y dark:divide-gray-700">
                                    {movements.map((m) => (
                                        <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-900 dark:text-white">{m.product?.name ?? m.product_id}</span>
                                                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    m.type === 'in' ? 'bg-green-100 text-green-800'
                                                    : m.type === 'out' ? 'bg-red-100 text-red-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>{m.type}</span>
                                                {m.notes && <span className="ml-2 text-xs text-gray-500">{m.notes}</span>}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span className="font-semibold">{m.quantity}</span>
                                                <span>{new Date(m.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
