import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { HeartHandshake, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState, { ErrorState } from '@/components/shared/LoadingState';

interface AidRequest {
    id: string;
    title: string;
    description: string;
    category?: string | null;
    goal_amount: number;
    raised_amount: number;
    currency: string;
    status: string;
    rejection_reason?: string | null;
    created_at: string;
}

interface AidDonation {
    id: string;
    amount: number;
    currency: string;
    status: string;
    aid_request?: { id?: string; title?: string; status?: string } | null;
    created_at: string;
}

const STATUS_TONE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    funded: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function MyAid() {
    const [requests, setRequests] = useState<AidRequest[]>([]);
    const [donations, setDonations] = useState<AidDonation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [goal, setGoal] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        Promise.all([
            api.get<{ data: AidRequest[] }>('/api/health/aid/mine?per_page=50'),
            api.get<{ data: AidDonation[] }>('/api/health/aid/donations?per_page=50'),
        ])
            .then(([reqRes, donRes]) => {
                setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
                setDonations(Array.isArray(donRes.data) ? donRes.data : []);
            })
            .catch((e) => setError(errorMessage(e, 'Failed to load your aid activity')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [attempt, load]);

    const submit = async () => {
        if (!title.trim() || !description.trim() || !goal) {
            toast.error('Title, description and goal amount are required');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/api/health/aid', {
                title: title.trim(),
                description: description.trim(),
                category: category || undefined,
                goal_amount: Number(goal),
                idempotency_key: `aid-req-${title.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 40)}-${Date.now()}`,
            });
            toast.success('Aid request submitted for review');
            setTitle('');
            setDescription('');
            setCategory('');
            setGoal('');
            setShowForm(false);
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to submit aid request'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="My Aid Requests">
            <Head title="My Aid Requests" />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex flex-wrap gap-2 text-sm">
                    <Link href="/healthcare" className="font-medium text-indigo-600 hover:underline">← Back to Healthcare</Link>
                    <Link href="/healthcare/aid" className="font-medium text-indigo-600 hover:underline">All aid requests</Link>
                    <Link href="/healthcare/bookings" className="font-medium text-indigo-600 hover:underline">Health Bookings</Link>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Requests you filed are reviewed by support before going public.
                    </p>
                    <button
                        onClick={() => setShowForm((v) => !v)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" /> New request
                    </button>
                </div>

                {showForm && (
                    <div className="space-y-3 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Request assistance</h2>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title (e.g. Dialysis support for Ama)"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Describe the need..."
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                        <div className="flex gap-3">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            >
                                <option value="">Category (optional)</option>
                                {['medical', 'emergency', 'medication', 'transport', 'other'].map((c) => (
                                    <option key={c} value={c}>
                                        {c.charAt(0).toUpperCase() + c.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min={1}
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="Goal amount (USD)"
                                className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={submit}
                                disabled={submitting}
                                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit for review'}
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <LoadingState message="Loading your aid activity..." />
                ) : error ? (
                    <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
                ) : (
                    <>
                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your requests</h2>
                            {requests.length === 0 ? (
                                <EmptyState
                                    icon={<HeartHandshake className="h-10 w-10" />}
                                    title="No aid requests yet"
                                    hint="Requests you file appear here with their review status."
                                />
                            ) : (
                                <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                                    {requests.map((r) => (
                                        <div key={r.id} className="px-6 py-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {r.category && (
                                                            <span className="mr-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                                {r.category}
                                                            </span>
                                                        )}
                                                        {r.title}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Goal {formatPrice(Number(r.goal_amount), r.currency)} · Raised{' '}
                                                        {formatPrice(Number(r.raised_amount), r.currency)} ·{' '}
                                                        {formatDateTime(r.created_at)}
                                                    </p>
                                                    {r.status === 'rejected' && r.rejection_reason && (
                                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                            Rejected: {r.rejection_reason}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                                            STATUS_TONE[r.status] ?? STATUS_TONE.closed
                                                        }`}
                                                    >
                                                        {r.status}
                                                    </span>
                                                    {(r.status === 'approved' || r.status === 'funded') && (
                                                        <Link
                                                            href={`/healthcare/aid/${r.id}`}
                                                            className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                                                        >
                                                            View
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your donations</h2>
                            {donations.length === 0 ? (
                                <EmptyState
                                    icon={<HeartHandshake className="h-10 w-10" />}
                                    title="No donations yet"
                                    hint="Donations you make to community aid requests appear here."
                                >
                                    <Link href="/healthcare/aid" className="mt-2 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                                        Browse aid requests
                                    </Link>
                                </EmptyState>
                            ) : (
                                <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                                    {donations.map((d) => (
                                        <div key={d.id} className="flex items-center justify-between px-6 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {d.aid_request?.title ?? 'Aid request'}
                                                </p>
                                                <p className="text-xs text-gray-500">{formatDateTime(d.created_at)}</p>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {formatPrice(Number(d.amount), d.currency)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
