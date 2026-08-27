import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Send, ArrowLeft, AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TicketMessage {
    id: string;
    sender_id: string;
    message: string;
    is_internal: boolean;
    created_at: string;
    sender?: { id: string; name: string };
}

interface Ticket {
    id: string;
    ticket_number: string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    department?: { name: string };
    messages: TicketMessage[];
    created_at: string;
}

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
};

interface TicketShowProps {
    ticket: Ticket;
}

export default function TicketShow({ ticket }: TicketShowProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState<TicketMessage[]>(ticket.messages ?? []);

    const sendReply = async () => {
        if (!reply.trim()) return;
        setSending(true);
        try {
            const res = await api.post<{ data: TicketMessage }>(`/api/tickets/${ticket.id}/reply`, { message: reply });
            setMessages([...messages, res.data]);
            setReply('');
        } catch (e: any) {
            alert(e.message ?? 'Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    return (
        <AppLayout>
            <Head title={`Ticket ${ticket.ticket_number}`} />

            <div className="space-y-6">
                <Link href="/tickets" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to tickets
                </Link>

                {/* Header */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-gray-500">{ticket.ticket_number}</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[ticket.priority] ?? ''}`}>
                                    {ticket.priority}
                                </span>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                                    {ticket.status}
                                </span>
                            </div>
                            <h1 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{ticket.subject}</h1>
                            {ticket.department && (
                                <p className="mt-1 text-sm text-gray-500">Department: {ticket.department.name}</p>
                            )}
                        </div>
                    </div>
                    {ticket.description && (
                        <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                        <MessageSquare className="h-5 w-5" /> Conversation
                    </h2>
                    <div className="mt-4 space-y-4">
                        {messages.length === 0 ? (
                            <p className="text-center text-gray-500">No messages yet.</p>
                        ) : (
                            messages.map((msg) => {
                                const isOwn = msg.sender_id === auth?.user?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xl rounded-lg p-4 ${
                                            isOwn ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700'
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {msg.sender?.name ?? 'Unknown'}
                                                </span>
                                                <span className="text-xs text-gray-400">{formatDateTime(msg.created_at)}</span>
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{msg.message}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Reply form */}
                    {ticket.status !== 'closed' && (
                        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                rows={3}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                placeholder="Type your reply..."
                            />
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={sendReply}
                                    disabled={sending || !reply.trim()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                    {sending ? 'Sending...' : 'Send Reply'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
