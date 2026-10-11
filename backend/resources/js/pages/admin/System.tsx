import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { Server, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SystemHealth {
    php_version: string;
    laravel_version: string;
    database_status: string;
    database_latency?: string;
    cache_status: string;
    cache_driver?: string;
    queue_status: string;
    queue_pending?: number;
    storage_used: string;
    checked_at: string;
}

interface StatsSystemResponse {
    status?: 'healthy' | 'degraded';
    data: {
        database?: { status?: string; latency_ms?: number };
        cache?: { status?: string; driver?: string };
        queue?: { status?: string; pending_jobs?: number };
        storage?: { status?: string; used_percent?: number };
        php_version?: string;
        laravel_version?: string;
        checked_at?: string;
    };
}

const DASH = '\u2014';

export default function AdminSystem() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [overall, setOverall] = useState<'healthy' | 'degraded' | null>(null);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        api.get<StatsSystemResponse>('/api/admin/stats/system')
            .then((res) => {
                const d = res.data ?? {};
                setOverall(res.status ?? null);
                setHealth({
                    php_version: d.php_version ?? DASH,
                    laravel_version: d.laravel_version ?? DASH,
                    database_status: d.database?.status ?? 'unknown',
                    database_latency: d.database?.latency_ms != null ? `${d.database.latency_ms} ms` : undefined,
                    cache_status: d.cache?.status ?? 'unknown',
                    cache_driver: d.cache?.driver,
                    queue_status: d.queue?.status ?? 'unknown',
                    queue_pending: d.queue?.pending_jobs,
                    storage_used: d.storage?.used_percent != null ? `${d.storage.used_percent}%` : DASH,
                    checked_at: d.checked_at ?? DASH,
                });
            })
            .catch(() => setHealth(null))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) return <AdminLayout title="System Health"><p className="p-12 text-center text-gray-500">Loading...</p></AdminLayout>;
    if (!health) return <AdminLayout title="System Health"><p className="p-12 text-center text-red-500">Failed to load</p></AdminLayout>;

    const StatusIcon = ({ status }: { status: string }) => (
        status === 'ok' || status === 'running' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
        status === 'error' ? <XCircle className="h-5 w-5 text-red-500" /> :
        <Clock className="h-5 w-5 text-yellow-500" />
    );

    const items = [
        { label: 'PHP Version', value: health.php_version },
        { label: 'Laravel Version', value: health.laravel_version },
        { label: 'Database', value: health.database_latency ? `${health.database_status} (${health.database_latency})` : health.database_status, status: true },
        { label: 'Cache', value: health.cache_driver ? `${health.cache_status} (${health.cache_driver})` : health.cache_status, status: true },
        { label: 'Queue', value: health.queue_pending != null ? `${health.queue_status} (${health.queue_pending} pending)` : health.queue_status, status: true },
        { label: 'Storage Used', value: health.storage_used },
        { label: 'Checked At', value: health.checked_at },
    ];

    return (
        <AdminLayout title="System Health">
            <Head title="System Health" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Server className="h-6 w-6" /> System Health
                    </h1>
                    {overall && (
                        <span
                            className={
                                overall === 'healthy'
                                    ? 'rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700'
                                    : 'rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700'
                            }
                        >
                            {overall === 'healthy' ? 'Healthy' : 'Degraded'}
                        </span>
                    )}
                    <button
                        onClick={load}
                        disabled={loading}
                        className="ml-auto rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        {loading ? 'Checking...' : 'Refresh'}
                    </button>
                </div>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="divide-y dark:divide-gray-700">
                        {items.map((item) => (
                            <div key={item.label} className="flex items-center justify-between py-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                                <div className="flex items-center gap-2">
                                    {item.status && <StatusIcon status={item.value} />}
                                    <span className="font-medium text-gray-900 dark:text-white capitalize">{item.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
