import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { Server, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SystemHealth {
    php_version: string;
    laravel_version: string;
    database_status: string;
    cache_status: string;
    queue_status: string;
    storage_used: string;
    uptime: string;
    last_deployment?: string;
    environment: string;
}

export default function AdminSystem() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<SystemHealth>('/api/admin/system/health')
            .then((res) => setHealth(res.data))
            .catch(() => setHealth(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <AppLayout title="System Health"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!health) return <AppLayout title="System Health"><p className="p-12 text-center text-red-500">Failed to load</p></AppLayout>;

    const StatusIcon = ({ status }: { status: string }) => (
        status === 'ok' || status === 'running' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
        status === 'error' ? <XCircle className="h-5 w-5 text-red-500" /> :
        <Clock className="h-5 w-5 text-yellow-500" />
    );

    const items = [
        { label: 'PHP Version', value: health.php_version },
        { label: 'Laravel Version', value: health.laravel_version },
        { label: 'Environment', value: health.environment },
        { label: 'Database', value: health.database_status, status: true },
        { label: 'Cache', value: health.cache_status, status: true },
        { label: 'Queue', value: health.queue_status, status: true },
        { label: 'Storage Used', value: health.storage_used },
        { label: 'Uptime', value: health.uptime },
    ];

    return (
        <AppLayout title="System Health">
            <Head title="System Health" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Server className="h-6 w-6" /> System Health
                </h1>
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
        </AppLayout>
    );
}
