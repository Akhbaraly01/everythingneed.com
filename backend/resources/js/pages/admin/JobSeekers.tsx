import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Briefcase, Handshake, MapPin, RotateCcw, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm';
import { formatDate } from '@/lib/utils';

interface Worker {
    id: string;
    headline: string;
    category: string;
    city?: string | null;
    country?: string | null;
    availability: string;
    hourly_rate?: string | null;
    daily_rate?: string | null;
    rating_avg: string;
    rating_count: number;
    completed_jobs: number;
    is_verified: boolean;
    deleted_at?: string | null;
    created_at: string;
    work_requests_count?: number;
    user?: { id: string; name: string; email: string } | null;
}

interface WorkRequest {
    id: string;
    title: string;
    category: string;
    location?: string | null;
    status: string;
    budget_min?: string | null;
    budget_max?: string | null;
    workers_needed: number;
    offers_count?: number;
    created_at: string;
    deleted_at?: string | null;
    requester?: { id: string; name: string; email: string } | null;
    worker_profile?: {
        id: string;
        headline: string;
        category: string;
        user?: { id: string; name: string; email: string } | null;
    } | null;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

const STATUS_COLORS: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    negotiating: 'bg-amber-100 text-amber-800',
    accepted: 'bg-indigo-100 text-indigo-800',
    paid: 'bg-emerald-100 text-emerald-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-700',
    disputed: 'bg-red-100 text-red-800',
};

const statusLabel = (s: string) => s.replace(/_/g, ' ');

export default function AdminJobSeekers() {
    const ask = useConfirm();
    const [view, setView] = useState<'workers' | 'requests'>('workers');

    const [workers, setWorkers] = useState<Worker[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState('');
    const [verified, setVerified] = useState<'' | 'true' | 'false'>('');
    const [includeDeleted, setIncludeDeleted] = useState(false);

    const [requests, setRequests] = useState<WorkRequest[]>([]);
    const [requestsMeta, setRequestsMeta] = useState<Meta | null>(null);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsPage, setRequestsPage] = useState(1);
    const [requestsStatus, setRequestsStatus] = useState('');
    const [requestsQuery, setRequestsQuery] = useState('');

    const loadWorkers = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), per_page: '25' });
        if (query.trim()) params.set('q', query.trim());
        if (verified !== '') params.set('verified', verified);
        if (includeDeleted) params.set('include_deleted', '1');

        api.get<{ data: Worker[]; meta: Meta }>(`/api/admin/job-seekers?${params}`)
            .then((res) => {
                setWorkers(rows<Worker>(res));
                setMeta(res.meta);
            })
            .catch((e) => {
                setWorkers([]);
                toast.error(errorMessage(e, 'Failed to load job seekers'));
            })
            .finally(() => setLoading(false));
    }, [page, query, verified, includeDeleted]);

    useEffect(() => {
        if (view === 'workers') loadWorkers();
    }, [view, loadWorkers]);

    const loadRequests = useCallback(() => {
        setRequestsLoading(true);
        const params = new URLSearchParams({ page: String(requestsPage), per_page: '25' });
        if (requestsQuery.trim()) params.set('q', requestsQuery.trim());
        if (requestsStatus) params.set('status', requestsStatus);
        if (includeDeleted) params.set('include_deleted', '1');

        api.get<{ data: WorkRequest[]; meta: Meta }>(`/api/admin/work-requests?${params}`)
            .then((res) => {
                setRequests(rows<WorkRequest>(res));
                setRequestsMeta(res.meta);
            })
            .catch((e) => {
                setRequests([]);
                toast.error(errorMessage(e, 'Failed to load work requests'));
            })
            .finally(() => setRequestsLoading(false));
    }, [requestsPage, requestsQuery, requestsStatus, includeDeleted]);

    useEffect(() => {
        if (view === 'requests') loadRequests();
    }, [view, loadRequests]);

    const toggleVerified = async (worker: Worker) => {
        try {
            await api.put(`/api/admin/job-seekers/${worker.id}`, { is_verified: !worker.is_verified });
            setWorkers((prev) => prev.map((w) => (w.id === worker.id ? { ...w, is_verified: !w.is_verified } : w)));
            toast.success(!worker.is_verified ? 'Worker verified.' : 'Verification removed.');
        } catch (e) {
            toast.error(errorMessage(e, 'Verification update failed'));
        }
    };

    const removeWorker = async (worker: Worker) => {
        const ok = await ask({
            title: `Remove ${worker.user?.name ?? 'this worker'}?`,
            description: 'The profile is soft-deleted and disappears from the public directory. Profiles with active work requests cannot be removed.',
            confirmLabel: 'Remove',
            danger: true,
        });
        if (!ok) return;

        try {
            await api.del(`/api/admin/job-seekers/${worker.id}`);
            toast.success('Worker profile removed.');
            loadWorkers();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to remove worker'));
        }
    };

    const restoreWorker = async (worker: Worker) => {
        try {
            await api.post(`/api/admin/job-seekers/${worker.id}/restore`);
            toast.success('Worker profile restored.');
            loadWorkers();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to restore worker'));
        }
    };

    const clearFilters = () => {
        setQuery('');
        setVerified('');
        setIncludeDeleted(false);
        setPage(1);
    };

    return (
        <AdminLayout title="Job Seekers">
            <Head title="Job Seekers" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <Handshake className="h-6 w-6" /> Job Seekers
                    </h1>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input type="checkbox" checked={includeDeleted} onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(1); setRequestsPage(1); }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                        Include removed profiles
                    </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-800">
                        <button onClick={() => setView('workers')} data-testid="job-seekers-tab-workers"
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${view === 'workers' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                            <Handshake className="h-4 w-4" /> Workers
                        </button>
                        <button onClick={() => setView('requests')} data-testid="job-seekers-tab-requests"
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${view === 'requests' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                            <Briefcase className="h-4 w-4" /> Work Requests
                        </button>
                    </div>
                    {view === 'workers' && meta && <span className="text-sm text-gray-500">{meta.total} workers</span>}
                    {view === 'requests' && requestsMeta && <span className="text-sm text-gray-500">{requestsMeta.total} requests</span>}
                </div>

                {view === 'workers' ? (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search name, headline, category, city" />
                            <select value={verified} onChange={(e) => { setVerified(e.target.value as '' | 'true' | 'false'); setPage(1); }}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                                <option value="">All verification</option>
                                <option value="true">Verified</option>
                                <option value="false">Unverified</option>
                            </select>
                            {(query || verified || includeDeleted) && (
                                <button onClick={clearFilters} className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400">Clear filters</button>
                            )}
                        </div>

                        <DataTable
                            columns={[
                                {
                                    key: 'worker', header: 'Worker',
                                    render: (w: Worker) => (
                                        <>
                                            <p className="font-medium dark:text-white">{w.user?.name ?? '—'}</p>
                                            <p className="text-xs text-gray-500">{w.headline}</p>
                                            <p className="text-xs text-gray-400">{w.user?.email}</p>
                                        </>
                                    ),
                                },
                                {
                                    key: 'category', header: 'Category', sortable: true,
                                    render: (w: Worker) => (
                                        <>
                                            <p className="text-sm dark:text-gray-200">{w.category}</p>
                                            {w.city && (
                                                <p className="flex items-center gap-1 text-xs text-gray-500">
                                                    <MapPin className="h-3 w-3" />{w.city}{w.country ? `, ${w.country}` : ''}
                                                </p>
                                            )}
                                        </>
                                    ),
                                },
                                {
                                    key: 'rate', header: 'Rate',
                                    render: (w: Worker) => (
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            {w.hourly_rate ? `$${w.hourly_rate}/hr` : w.daily_rate ? `$${w.daily_rate}/day` : '—'}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'reputation', header: 'Reputation',
                                    render: (w: Worker) => (
                                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                            <Star className="h-3.5 w-3.5 text-amber-500" />
                                            {Number(w.rating_avg).toFixed(1)} ({w.rating_count}) · {w.completed_jobs} jobs
                                        </span>
                                    ),
                                },
                                {
                                    key: 'availability', header: 'Availability',
                                    render: (w: Worker) => (
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                            {w.availability}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'status', header: 'Status',
                                    render: (w: Worker) => (
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${w.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                                                <BadgeCheck className="h-3 w-3" />{w.is_verified ? 'Verified' : 'Unverified'}
                                            </span>
                                            {w.deleted_at && (
                                                <span className="inline-flex w-fit rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Removed</span>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    key: 'requests', header: 'Requests',
                                    render: (w: Worker) => <span className="text-sm text-gray-600 dark:text-gray-300">{w.work_requests_count ?? 0}</span>,
                                },
                                {
                                    key: 'joined', header: 'Joined',
                                    render: (w: Worker) => <span className="text-xs text-gray-500">{formatDate(w.created_at)}</span>,
                                },
                                {
                                    key: 'actions', header: 'Actions',
                                    render: (w: Worker) => (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {!w.deleted_at && (
                                                <button onClick={() => void toggleVerified(w)} data-testid={`worker-verify-${w.id}`}
                                                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${w.is_verified ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}>
                                                    <BadgeCheck className="h-3 w-3" /> {w.is_verified ? 'Unverify' : 'Verify'}
                                                </button>
                                            )}
                                            {w.deleted_at ? (
                                                <button onClick={() => void restoreWorker(w)} data-testid={`worker-restore-${w.id}`}
                                                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                                    <RotateCcw className="h-3 w-3" /> Restore
                                                </button>
                                            ) : (
                                                <button onClick={() => void removeWorker(w)} data-testid={`worker-delete-${w.id}`}
                                                    className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800">
                                                    <Trash2 className="h-3 w-3" /> Remove
                                                </button>
                                            )}
                                        </div>
                                    ),
                                },
                            ]}
                            data={workers}
                            loading={loading}
                            emptyTitle="No job seekers"
                            emptyDescription="Worker profiles appear here as soon as workers publish them."
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
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <SearchInput value={requestsQuery} onChange={(v) => { setRequestsQuery(v); setRequestsPage(1); }} placeholder="Search title, category, requester" />
                            <select value={requestsStatus} onChange={(e) => { setRequestsStatus(e.target.value); setRequestsPage(1); }}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                                <option value="">All statuses</option>
                                {['open', 'negotiating', 'accepted', 'paid', 'in_progress', 'completed', 'cancelled', 'disputed'].map((s) => (
                                    <option key={s} value={s}>{statusLabel(s)}</option>
                                ))}
                            </select>
                        </div>

                        <DataTable
                            columns={[
                                {
                                    key: 'request', header: 'Request',
                                    render: (r: WorkRequest) => (
                                        <>
                                            <p className="font-medium dark:text-white">{r.title}</p>
                                            <p className="text-xs text-gray-500">{r.category}{r.location ? ` · ${r.location}` : ''}</p>
                                            {r.deleted_at && <span className="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Removed</span>}
                                        </>
                                    ),
                                },
                                {
                                    key: 'requester', header: 'Requester',
                                    render: (r: WorkRequest) => (
                                        <>
                                            <p className="text-sm dark:text-gray-200">{r.requester?.name ?? '—'}</p>
                                            <p className="text-xs text-gray-500">{r.requester?.email ?? ''}</p>
                                        </>
                                    ),
                                },
                                {
                                    key: 'worker', header: 'Worker',
                                    render: (r: WorkRequest) => (
                                        r.worker_profile ? (
                                            <>
                                                <p className="text-sm dark:text-gray-200">{r.worker_profile.user?.name ?? r.worker_profile.headline}</p>
                                                <p className="text-xs text-gray-500">{r.worker_profile.category}</p>
                                            </>
                                        ) : <span className="text-xs text-gray-400">Open to offers</span>
                                    ),
                                },
                                {
                                    key: 'status', header: 'Status',
                                    render: (r: WorkRequest) => (
                                        <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                            {statusLabel(r.status)}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'budget', header: 'Budget',
                                    render: (r: WorkRequest) => (
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            {r.budget_min || r.budget_max ? `$${r.budget_min ?? 0} - $${r.budget_max ?? 0}` : '—'}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'offers', header: 'Offers',
                                    render: (r: WorkRequest) => <span className="text-sm text-gray-600 dark:text-gray-300">{r.offers_count ?? 0}</span>,
                                },
                                {
                                    key: 'created', header: 'Created',
                                    render: (r: WorkRequest) => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span>,
                                },
                            ]}
                            data={requests}
                            loading={requestsLoading}
                            emptyTitle="No work requests"
                            emptyDescription="Requests appear here as soon as customers post them."
                        />

                        {requestsMeta && requestsMeta.last_page > 1 && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>Page {requestsMeta.current_page} of {requestsMeta.last_page}</span>
                                <div className="flex gap-2">
                                    <button disabled={requestsMeta.current_page <= 1} onClick={() => setRequestsPage(requestsPage - 1)}
                                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                                    <button disabled={requestsMeta.current_page >= requestsMeta.last_page} onClick={() => setRequestsPage(requestsPage + 1)}
                                        className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
