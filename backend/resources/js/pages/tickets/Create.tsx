import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';

export default function TicketCreate() {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!subject.trim() || !description.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/tickets', {
                subject,
                description,
                priority,
            });
            router.visit(`/tickets/${res.data.id}`);
        } catch (e: any) {
            alert(e.message ?? 'Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="Create Ticket">
            <Head title="Create Support Ticket" />

            <div className="space-y-6 max-w-2xl">
                <Link href="/tickets" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to tickets
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Support Ticket</h2>
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject *</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                placeholder="Brief description of your issue"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                placeholder="Describe your issue in detail..."
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                        <Link href="/tickets" className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium hover:bg-gray-50 dark:border-gray-600">
                            Cancel
                        </Link>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !subject.trim() || !description.trim()}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            {submitting ? 'Creating...' : 'Create Ticket'}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
