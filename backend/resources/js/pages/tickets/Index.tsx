import { statusTone } from '@/lib/lifecycle';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Headphones, Plus, ArrowRight, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Ticket {
    id: string;
    ticket_number: string;
    subject: string;
    priority: string;
    status: string;
    created_at: string;
    department?: { name: string };
}

interface TicketsResponse {
    data: Ticket[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
};

export default function TicketsIndex() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<TicketsResponse>('/api/tickets')
            .then((res) => setTickets(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load tickets'));
                setTickets([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    return (
        <AppLayout title="Support Tickets">
            <Head title="Support Tickets" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
                    <Link
                        href="/account/support/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" /> New Ticket
                    </Link>
                </div>
                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={load} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Headphones className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tickets yet</h3>
                        <p className="mt-2 text-gray-500">Need help? Create a support ticket.</p>
                        <Link href="/account/support/create" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Create Ticket
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/account/support/${ticket.id}`}
                                className="flex items-center justify-between rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[ticket.priority] ?? 'bg-gray-100 text-gray-800'}`}>
                                            {ticket.priority}
                                        </span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{ticket.subject}</p>
                                    <p className="text-xs text-gray-400">{formatDateTime(ticket.created_at)}</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
