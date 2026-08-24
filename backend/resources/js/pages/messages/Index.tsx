import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Ticket } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface MessagesProps {
    tickets: {
        data: Ticket[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

const statusIcons: Record<string, typeof MessageSquare> = {
    open: Clock,
    in_progress: AlertCircle,
    closed: CheckCircle,
};

const statusColors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    closed: 'bg-green-100 text-green-800',
};

export default function Messages({ tickets }: MessagesProps) {
    return (
        <AppLayout title="Messages">
            <Head title="Messages" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-gray-600 dark:text-gray-400">
                        {tickets.meta.total} tickets
                    </p>
                    <Link
                        href="/tickets/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" />
                        New Ticket
                    </Link>
                </div>

                {tickets.data.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tickets</h3>
                        <p className="mt-2 text-gray-500">Create a support ticket to get help.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.data.map((ticket) => {
                            const StatusIcon = statusIcons[ticket.status] ?? Clock;
                            return (
                                <Link
                                    key={ticket.id}
                                    href={`/tickets/${ticket.id}`}
                                    className="block rounded-lg bg-white p-6 shadow transition hover:shadow-md dark:bg-gray-800"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <StatusIcon className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {ticket.subject}
                                                </h3>
                                                <p className="text-sm text-gray-500">#{ticket.ticket_number}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{formatDateTime(ticket.created_at)}</span>
                                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[ticket.status] ?? ''}`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
