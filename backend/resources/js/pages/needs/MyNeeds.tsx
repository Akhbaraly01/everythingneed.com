import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { NEED_STATUS_LABELS, needStatusClasses } from '@/lib/needs';
import { ArrowRight, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { NeedRequestDetail, NeedStatus } from '@/types';

const TABS: { key: string; label: string; match: (s: NeedStatus) => boolean }[] = [
    { key: 'all', label: 'All', match: () => true },
    { key: 'active', label: 'Active', match: (s) => ['pending', 'published', 'reviewing', 'offered', 'negotiating', 'accepted', 'payment_pending', 'paid', 'in_progress', 'fulfilled', 'draft'].includes(s) },
    { key: 'attention', label: 'Needs attention', match: (s) => ['draft', 'accepted', 'payment_pending', 'in_progress', 'fulfilled'].includes(s) },
    { key: 'done', label: 'Completed', match: (s) => ['completed'].includes(s) },
    { key: 'closed', label: 'Closed', match: (s) => ['cancelled', 'rejected', 'expired', 'refunded'].includes(s) },
];

/**
 * Spec S14 - /needs/my-needs. The requester's board over their own needs
 * (drafts through closed), each row deep-linking to its detail workspace.
 */
export default function MyNeeds() {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [needs, setNeeds] = useState<NeedRequestDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState('all');

    useEffect(() => {
        if (!auth?.user) {
            window.location.href = '/login';
            return;
        }
        api.get<{ data: NeedRequestDetail[] }>('/api/need-requests', { params: { scope: 'mine', per_page: 100 } })
            .then((res) => setNeeds(res.data ?? []))
            .catch((e) => setError(errorMessage(e, 'Could not load your needs')))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const visible = useMemo(() => {
        const active = TABS.find((t) => t.key === tab) ?? TABS[0];
        return needs.filter((n) => active.match(n.status));
    }, [needs, tab]);

    return (
        <AppLayout title="My Needs">
            <Head title="My Needs" />
            <div className="mx-auto max-w-4xl space-y-6 px-3 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Needs</h1>
                        <p className="text-sm text-gray-500">Track, negotiate and complete your requests.</p>
                    </div>
                    <Link
                        href="/needs/create"
                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" /> New need
                    </Link>
                </div>

                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter needs">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={tab === t.key}
                            onClick={() => setTab(t.key)}
                            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                                tab === t.key
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading && <p className="text-sm text-gray-500">Loading your needs...</p>}
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

                {!loading && !error && visible.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="text-lg font-medium">Nothing here yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Submit a need and providers will start offering.</p>
                        <Link href="/needs/create" className="mt-4 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            <Plus className="h-4 w-4" /> Submit a need
                        </Link>
                    </div>
                )}

                {!loading && visible.length > 0 && (
                    <ul className="space-y-3">
                        {visible.map((need) => (
                            <li key={need.id}>
                                <Link
                                    href={`/needs/my-needs/${need.id}`}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${needStatusClasses(need.status)}`}>
                                                {NEED_STATUS_LABELS[need.status]}
                                            </span>
                                            <span className="text-xs text-gray-400">#{need.request_number}</span>
                                        </div>
                                        <p className="mt-1 truncate font-medium text-gray-900 dark:text-white">{need.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {need.category?.name ? `${need.category.name} · ` : ''}
                                            {new Date(need.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
