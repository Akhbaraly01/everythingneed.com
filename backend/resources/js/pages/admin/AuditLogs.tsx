import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Shield, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuditLog {
    id: string;
    user_name: string;
    action: string;
    entity_type: string;
    entity_id: string;
    ip_address?: string;
    details?: string;
    created_at: string;
}

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');

    useEffect(() => {
        const params = actionFilter ? `?action=${encodeURIComponent(actionFilter)}` : '';
        api.get<{ data: AuditLog[] }>(`/api/admin/audit-logs${params}`)
            .then((res) => setLogs(res.data))
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }, [actionFilter]);

    return (
        <AppLayout title="Audit Logs">
            <Head title="Audit Logs" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
                <input type="text" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} placeholder="Filter by action..."
                    className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : logs.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Shield className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No audit logs</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Entity</th>
                                    <th className="px-4 py-3">IP</th>
                                    <th className="px-4 py-3">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {logs.map((l) => (
                                    <tr key={l.id}>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{l.user_name}</td>
                                        <td className="px-4 py-3"><span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">{l.action}</span></td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{l.entity_type} #{l.entity_id}</td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{l.ip_address}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(l.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
