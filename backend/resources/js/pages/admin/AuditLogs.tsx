import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { Download, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AuditLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    ip_address?: string | null;
    old_values?: string | null;
    new_values?: string | null;
    metadata?: string | null;
    created_at: string;
    performed_by_email?: string | null;
    performed_by_name?: string | null;
}

interface Meta {
    total: number;
    page: number;
    per_page: number;
}

const EMPTY_FILTERS = {
    search: '',
    action: '',
    entity_type: '',
    date_from: '',
    date_to: '',
};

type Filters = typeof EMPTY_FILTERS;

const buildParams = (f: Filters, p: number, pp: number) => {
    const params = new URLSearchParams();
    if (f.search) params.set('search', f.search);
    if (f.action) params.set('action', f.action);
    if (f.entity_type) params.set('entity_type', f.entity_type);
    if (f.date_from) params.set('date_from', f.date_from);
    if (f.date_to) params.set('date_to', f.date_to);
    params.set('page', String(p));
    params.set('per_page', String(pp));
    return params.toString();
};

export default function AdminAuditLogs() {
    const permissions =
        (usePage().props.auth as { permissions?: string[] } | null)?.permissions ?? [];
    const canExport = permissions.includes('*') || permissions.includes('audit.logs.export');

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, per_page: 25 });
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
    const [perPage, setPerPage] = useState(25);
    const [page, setPage] = useState(1);
    // Server-derived vocabulary (base list + every action present in the
    // trail) — the static 6-item list used to hide dotted rows.
    const [actionOptions, setActionOptions] = useState<string[]>([]);

    useEffect(() => {
        api.get<{ data: string[] }>('/api/admin/audit-logs/actions')
            .then((res) => setActionOptions(res.data ?? []))
            .catch(() => setActionOptions([]));
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.get<{ data: AuditLog[]; meta: Meta }>(`/api/admin/audit-logs?${buildParams(applied, page, perPage)}`)
            .then((res) => {
                if (cancelled) return;
                setLogs(res.data ?? []);
                setMeta(res.meta ?? { total: 0, page, per_page: perPage });
            })
            .catch((err) => {
                if (cancelled) return;
                setLogs([]);
                toast.error(errorMessage(err, 'Failed to load audit logs'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [applied, page, perPage]);

    const apply = () => {
        setPage(1);
        setApplied(filters);
    };

    const exportCsv = async () => {
        setExporting(true);
        try {
            await api.download(
                `/api/admin/audit-logs/export?${buildParams(applied, 1, 25)}`,
                `everythingneed-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
            );
            toast.success('Audit log exported');
        } catch (err) {
            toast.error(errorMessage(err, 'Export failed'));
        } finally {
            setExporting(false);
        }
    };

    const lastPage = Math.max(1, Math.ceil(meta.total / meta.per_page));
    const actor = (l: AuditLog) => l.performed_by_name || l.performed_by_email || 'system';
    const changes = (l: AuditLog) => l.new_values || l.old_values || '';

    const inputClass =
        'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';

    return (
        <AdminLayout title="Audit Logs">
            <Head title="Audit Logs" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
                    {canExport && (
                        <button
                            onClick={() => void exportCsv()}
                            disabled={exporting}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">Search</label>
                            <input
                                type="text"
                                maxLength={100}
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && apply()}
                                placeholder="email, entity id, values..."
                                className={`w-56 ${inputClass}`}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">Action</label>
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                className={inputClass}
                            >
                                <option value="">All actions</option>
                                {actionOptions.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">Entity type</label>
                            <input
                                type="text"
                                maxLength={60}
                                value={filters.entity_type}
                                onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
                                placeholder="settings, orders..."
                                className={`w-40 ${inputClass}`}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">From</label>
                            <input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">To</label>
                            <input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <button
                            onClick={apply}
                            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
                        >
                            <Search className="h-4 w-4" /> Apply
                        </button>
                        <button
                            onClick={() => {
                                setFilters(EMPTY_FILTERS);
                                setPage(1);
                                setApplied(EMPTY_FILTERS);
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'actor', header: 'Actor',
                            render: (l) => <span className="font-medium text-gray-900 dark:text-white">{actor(l)}</span>,
                        },
                        {
                            key: 'action', header: 'Action', accessor: 'action', sortable: true,
                            render: (l) => (
                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                                    {l.action}
                                </span>
                            ),
                        },
                        {
                            key: 'entity', header: 'Entity',
                            render: (l) => <span className="text-sm text-gray-500">{l.entity_type} #{l.entity_id}</span>,
                        },
                        {
                            key: 'ip', header: 'IP', accessor: 'ip_address', sortable: true,
                            render: (l) => <span className="text-xs text-gray-500">{l.ip_address || '-'}</span>,
                        },
                        {
                            key: 'changes', header: 'Changes',
                            render: (l) => (
                                <span className="block max-w-xs truncate text-xs text-gray-400" title={changes(l)}>
                                    {changes(l) || '-'}
                                </span>
                            ),
                        },
                        {
                            key: 'time', header: 'Time', accessor: 'created_at', sortable: true,
                            render: (l) => <span className="text-xs text-gray-500">{formatDateTime(l.created_at)}</span>,
                        },
                    ]}
                    data={logs}
                    loading={loading}
                    emptyTitle="No audit logs match these filters"
                />

                {/* Pagination */}
                {!loading && meta.total > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-gray-500">
                            {meta.total} event{meta.total === 1 ? '' : 's'} · page {meta.page} of {lastPage}
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className={inputClass}
                            >
                                {[25, 50, 100].map((n) => (
                                    <option key={n} value={n}>{n} / page</option>
                                ))}
                            </select>
                            <button
                                disabled={meta.page <= 1}
                                onClick={() => setPage(meta.page - 1)}
                                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600"
                            >
                                <ChevronLeft className="h-4 w-4" /> Prev
                            </button>
                            <button
                                disabled={meta.page >= lastPage}
                                onClick={() => setPage(meta.page + 1)}
                                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
