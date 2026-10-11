import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, Plus } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

interface ServiceRequest {
    id: string;
    request_number: string;
    category: string;
    title: string;
    details: string;
    preferred_date?: string | null;
    location?: string | null;
    status: string;
    admin_note?: string | null;
    assigned_doctor?: { id?: string; full_name?: string } | null;
    created_at: string;
}

const STATUS_TONE: Record<string, string> = {
    open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    scheduled: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    closed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const CATEGORIES = ['general', 'home-care', 'nursing', 'physiotherapy', 'lab-at-home', 'medical-equipment', 'counseling', 'nutrition', 'dental', 'other'];

export default function ServiceRequests() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [category, setCategory] = useState('general');
    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const [preferredDate, setPreferredDate] = useState('');
    const [location, setLocation] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        api.get<{ data: ServiceRequest[] }>('/api/health/service-requests/mine?per_page=50')
            .then((res) => setRequests(Array.isArray(res.data) ? res.data : []))
            .catch((e) => setError(errorMessage(e, 'Failed to load your requests')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [attempt, load]);

    const submit = async () => {
        if (!title.trim() || !details.trim()) {
            toast.error('Title and details are required');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/api/health/service-requests', {
                category,
                title: title.trim(),
                details: details.trim(),
                preferred_date: preferredDate || undefined,
                location: location.trim() || undefined,
                contact_phone: contactPhone.trim() || undefined,
                idempotency_key: `hsr-${title.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 40)}-${Date.now()}`,
            });
            toast.success('Request submitted — the healthcare team will respond');
            setTitle('');
            setDetails('');
            setCategory('general');
            setPreferredDate('');
            setLocation('');
            setContactPhone('');
            setShowForm(false);
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to submit request'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title="Custom Health Requests">
            <Head title="Custom Health Requests" />
            <div className="mx-auto max-w-3xl space-y-6">
                <Link href="/healthcare/bookings" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to Health Bookings
                </Link>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                            <ClipboardList className="h-6 w-6" /> Others — Custom Requests
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">Describe exactly what you need. The healthcare team reviews every request.</p>
                    </div>
                    <button
                        onClick={() => setShowForm((v) => !v)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" /> New request
                    </button>
                </div>

                {showForm && (
                    <div className="space-y-3 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">What do you need?</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category
                                <select value={category} onChange={(e) => setCategory(e.target.value)}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title *
                                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={180}
                                    placeholder="e.g. Nurse for post-surgery home care"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Details — define your need specifically *
                            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} maxLength={4000}
                                placeholder="What service, for whom, how often, any medical notes…"
                                className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Preferred date
                                <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)}
                                    className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location
                                <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={500}
                                    placeholder="Area / city"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact phone
                                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} maxLength={40}
                                    placeholder="How to reach you"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                        </div>
                        <button onClick={submit} disabled={submitting}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                            {submitting ? 'Submitting…' : 'Submit request'}
                        </button>
                    </div>
                )}

                {loading ? (
                    <p className="p-12 text-center text-gray-500">Loading…</p>
                ) : error ? (
                    <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
                        <p className="font-medium text-red-600">{error}</p>
                        <button onClick={() => setAttempt((t) => t + 1)} className="mt-3 text-sm font-medium text-indigo-600 hover:underline">Retry</button>
                    </div>
                ) : requests.length === 0 ? (
                    <EmptyState title="No custom requests yet" hint="File your first request above and track its progress here." />
                ) : (
                    <ul className="space-y-3">
                        {requests.map((r) => (
                            <li key={r.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{r.title}</p>
                                        <p className="font-mono text-xs text-gray-500">{r.request_number} • {r.category.replace(/-/g, ' ')}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {r.status}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{r.details}</p>
                                {r.assigned_doctor?.full_name && (
                                    <p className="mt-2 text-sm text-gray-500">Assigned: {r.assigned_doctor.full_name}</p>
                                )}
                                {r.admin_note && (
                                    <p className="mt-2 rounded bg-indigo-50 p-2 text-sm text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                                        Team update: {r.admin_note}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
