import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';
import { useState } from 'react';
import MediaUploadInput from '@/components/shared/MediaUploadInput';

const MAX_ATTACHMENTS = 5;

/**
 * The ticket API stores attachments as public-disk paths scoped to the
 * uploader (uploads/u/{id}/ticket-attachments/...), so the uploaded URL is
 * reduced to that path before it is sent.
 */
const attachmentPath = (url: string): string =>
    url.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, '').replace(/^storage\//, '');

export default function TicketCreate() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('medium');
    const [attachments, setAttachments] = useState<string[]>([]);
    const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!subject.trim() || !message.trim()) return;
        setSubmitting(true);
        setErrors({});
        try {
            const paths = attachments
                .map(attachmentPath)
                .filter((p) => p !== '' && p.startsWith('uploads/u/'));
            const res = await api.post<{ data: { id: string } }>('/api/tickets', {
                subject: subject.trim(),
                message: message.trim(),
                priority,
                ...(paths.length > 0 ? { attachments: paths } : {}),
            });
            router.visit(`/account/support/${res.data.id}`);
        } catch (e) {
            if (e instanceof ApiError && e.errors) {
                setErrors({
                    subject: e.errors.subject?.[0],
                    message: e.errors.message?.[0],
                });
            }
            toast.error(errorMessage(e, 'Failed to create ticket'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="Create Ticket">
            <Head title="Create Support Ticket" />
            <div className="space-y-6 max-w-2xl">
                <Link href="/account/support" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to tickets
                </Link>
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Support Ticket</h2>
                    <div className="mt-4 space-y-4">
                        <div>
                            <label htmlFor="ticket-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject *</label>
                            <input
                                id="ticket-subject"
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                placeholder="Brief description of your issue"
                            />
                            {errors.subject && (
                                <p className="mt-1 text-sm text-red-600" role="alert">{errors.subject}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="ticket-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                            <select
                                id="ticket-priority"
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
                            <label htmlFor="ticket-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message *</label>
                            <textarea
                                id="ticket-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                                placeholder="Describe your issue in detail..."
                            />
                            {errors.message && (
                                <p className="mt-1 text-sm text-red-600" role="alert">{errors.message}</p>
                            )}
                        </div>
                        <div>
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Attachments <span className="text-gray-400">(optional, up to {MAX_ATTACHMENTS})</span>
                            </span>
                            <div className="mt-2 space-y-3">
                                {attachments.map((url, index) => (
                                    <div key={index} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                        <MediaUploadInput
                                            value={url}
                                            onChange={(next) =>
                                                setAttachments((prev) => prev.map((v, i) => (i === index ? next : v)))
                                            }
                                            kind="image"
                                            folder="ticket-attachments"
                                            label={`Attachment ${index + 1}`}
                                            hint="Images up to 25MB."
                                        />
                                        {url.trim() !== '' && !attachmentPath(url).startsWith('uploads/u/') && (
                                            <p className="mt-1 text-xs text-red-600">
                                                Attachments must be uploaded here - external links are not accepted.
                                            </p>
                                        )}
                                    </div>
                                ))}
                                {attachments.length < MAX_ATTACHMENTS && (
                                    <button
                                        type="button"
                                        onClick={() => setAttachments((prev) => [...prev, ''])}
                                        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-300"
                                    >
                                        <Paperclip className="h-4 w-4" /> Add attachment
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                        <Link href="/account/support" className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium hover:bg-gray-50 dark:border-gray-600">
                            Cancel
                        </Link>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !subject.trim() || !message.trim()}
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
