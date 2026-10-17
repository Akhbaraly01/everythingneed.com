import ProviderLayout from '@/layouts/ProviderLayout';
import { Head, Link } from '@inertiajs/react';
import { api, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { statusTone } from '@/lib/lifecycle';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MatchRow {
    id: string;
    request_number: string;
    title: string;
    status: string;
    eligible: boolean;
    reasons: string[];
}

interface OfferRow {
    id: string;
    price: number | string;
    status: string;
    created_at: string;
    request?: { id: string; request_number?: string | null; title?: string | null; status?: string | null } | null;
}

interface WorkRow {
    id: string;
    request_number: string;
    title: string;
    status: string;
    booking?: { scheduled_start: string; scheduled_end: string } | null;
}

interface ListingRow {
    id: string;
    name: string;
    price?: number | string | null;
    status: string;
    is_available?: boolean | null;
}

type Tab = 'opportunities' | 'offers' | 'work' | 'listings';

const tabs: { key: Tab; label: string }[] = [
    { key: 'opportunities', label: 'Opportunities' },
    { key: 'offers', label: 'My offers' },
    { key: 'work', label: 'My work' },
    { key: 'listings', label: 'My listings' },
];

const table = 'w-full text-sm';
const th = 'border-b px-3 py-2 text-left font-medium text-gray-500 dark:border-gray-700';
const td = 'border-b px-3 py-2 dark:border-gray-700';

/**
 * TODO 19 provider needs hub: eligible opportunities with reasons, offer
 * pipeline, accepted work with slots, and listing states — every row
 * scoped to the authenticated provider server-side.
 */
export default function ProviderNeedsHub() {
    const [tab, setTab] = useState<Tab>('opportunities');
    const [loading, setLoading] = useState(true);
    const [matches, setMatches] = useState<MatchRow[]>([]);
    const [offers, setOffers] = useState<OfferRow[]>([]);
    const [work, setWork] = useState<WorkRow[]>([]);
    const [listings, setListings] = useState<ListingRow[]>([]);

    useEffect(() => {
        setLoading(true);
        const jobs: Promise<unknown>[] = [];
        if (tab === 'opportunities') {
            jobs.push(
                api.get<{ data: MatchRow[] }>('/api/provider-matches?limit=20').then((res) => setMatches(rows(res))),
            );
        } else if (tab === 'offers') {
            jobs.push(api.get<{ data: OfferRow[] }>('/api/my-offers').then((res) => setOffers(rows(res))));
        } else if (tab === 'work') {
            jobs.push(api.get<{ data: WorkRow[] }>('/api/my-work').then((res) => setWork(rows(res))));
        } else {
            jobs.push(api.get<{ data: ListingRow[] }>('/api/my-listings').then((res) => setListings(rows(res))));
        }
        Promise.all(jobs)
            .catch(() => toast.error('Could not load.'))
            .finally(() => setLoading(false));
    }, [tab]);

    return (
        <ProviderLayout title="Needs Work">
            <Head title="Needs Work" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Needs Work</h1>
                    <Link href="/provider/profile" className="text-sm font-medium text-indigo-600 hover:underline">
                        Provider profile
                    </Link>
                </div>

                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Provider needs sections">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={tab === t.key}
                            onClick={() => setTab(t.key)}
                            className={`min-h-[44px] rounded-full px-4 py-1.5 text-sm font-medium ${
                                tab === t.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-sm text-gray-500">Loading…</p>
                ) : (
                    <div className="overflow-x-auto rounded border dark:border-gray-700">
                        {tab === 'opportunities' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Request</th><th scope="col" className={th}>Title</th><th scope="col" className={th}>Eligible</th><th scope="col" className={th}>Why</th></tr></thead>
                                <tbody>
                                    {matches.map((m) => (
                                        <tr key={m.id}>
                                            <td className={`${td} font-mono text-xs`}>{m.request_number}</td>
                                            <td className={td}>
                                                {m.eligible ? (
                                                    <Link href={`/needs/requests/${m.id}`} className="text-indigo-600 hover:underline">{m.title}</Link>
                                                ) : (
                                                    <span>{m.title}</span>
                                                )}
                                            </td>
                                            <td className={td}>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.eligible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {m.eligible ? 'yes' : 'no'}
                                                </span>
                                            </td>
                                            <td className={`${td} text-xs text-gray-500`}>{m.reasons.join(' · ') || '—'}</td>
                                        </tr>
                                    ))}
                                    {matches.length === 0 && <tr><td className={td} colSpan={4}>No open requests right now.</td></tr>}
                                </tbody>
                            </table>
                        )}
                        {tab === 'offers' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Request</th><th scope="col" className={th}>Price</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Sent</th></tr></thead>
                                <tbody>
                                    {offers.map((o) => (
                                        <tr key={o.id}>
                                            <td className={`${td} text-xs`}>{o.request?.request_number ?? '—'} · {o.request?.title ?? ''}</td>
                                            <td className={`${td} font-semibold`}>{o.price}</td>
                                            <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(o.status)}`}>{o.status}</span></td>
                                            <td className={`${td} text-xs`}>{formatDateTime(o.created_at)}</td>
                                        </tr>
                                    ))}
                                    {offers.length === 0 && <tr><td className={td} colSpan={4}>No offers yet — browse opportunities to bid.</td></tr>}
                                </tbody>
                            </table>
                        )}
                        {tab === 'work' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Request</th><th scope="col" className={th}>Title</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Slot</th></tr></thead>
                                <tbody>
                                    {work.map((w) => (
                                        <tr key={w.id}>
                                            <td className={`${td} font-mono text-xs`}>{w.request_number}</td>
                                            <td className={td}>
                                                <Link href={`/needs/my-needs/${w.id}/tracking`} className="text-indigo-600 hover:underline">{w.title}</Link>
                                            </td>
                                            <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(w.status)}`}>{w.status}</span></td>
                                            <td className={`${td} text-xs`}>{w.booking ? new Date(w.booking.scheduled_start).toLocaleString() : '—'}</td>
                                        </tr>
                                    ))}
                                    {work.length === 0 && <tr><td className={td} colSpan={4}>No active jobs.</td></tr>}
                                </tbody>
                            </table>
                        )}
                        {tab === 'listings' && (
                            <table className={table}>
                                <thead><tr><th scope="col" className={th}>Listing</th><th scope="col" className={th}>Price</th><th scope="col" className={th}>Status</th></tr></thead>
                                <tbody>
                                    {listings.map((l) => (
                                        <tr key={l.id}>
                                            <td className={td}>{l.name}</td>
                                            <td className={`${td} font-semibold`}>{l.price ?? '—'}</td>
                                            <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(l.status)}`}>{l.status}</span></td>
                                        </tr>
                                    ))}
                                    {listings.length === 0 && <tr><td className={td} colSpan={3}>No listings yet.</td></tr>}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </ProviderLayout>
    );
}
