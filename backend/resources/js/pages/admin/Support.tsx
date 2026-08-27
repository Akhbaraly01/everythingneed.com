import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Headphones } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Ticket {
    id: string;
    reference: string;
    subject: string;
    status: string;
    priority: string;
    user_name?: string;
    created_at: string;
}

export default function AdminSupport() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Ticket[] }>('/api/admin/support/tickets')
            .then((res) => setTickets(res.data))
            .catch(() => setTickets([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Support Staff">
            <Head title="Support Staff" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : tickets.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Headphones className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No tickets</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-4 py-3">Subject</th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {tickets.map((t) => (
                                    <tr key={t.id}>
                                        <td className="px-4 py-3 font-mono text-xs">{t.reference}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.subject}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{t.user_name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                t.status === 'open' ? 'bg-green-100 text-green-800' :
                                                t.status === 'closed' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                                            }`}>{t.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                t.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                t.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                                            }`}>{t.priority}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(t.created_at)}</td>
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
