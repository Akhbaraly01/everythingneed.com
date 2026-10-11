import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { NEED_STATUS_LABELS, needStatusClasses } from '@/lib/needs';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { NeedOffer, NeedRequestDetail } from '@/types';

/**
 * Spec S14 /needs/my-needs/{id}/offers: the requester accepts or rejects
 * offers. Negotiation counters arrive as re-submitted offers on a request
 * in the `negotiating` state (spec S13) - the newest version wins.
 */
export default function MyNeedOffers({ need_id }: { need_id: string }) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [need, setNeed] = useState<NeedRequestDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        api.get<{ data: NeedRequestDetail }>(`/api/need-requests/${need_id}`)
            .then((res) => setNeed(res.data))
            .catch((e) => setError(errorMessage(e, 'Could not load offers')));
    }, [need_id]);

    useEffect(() => {
        load();
    }, [load]);

    const isOwner = !!need && auth?.user?.id === need.user_id;
    // Server re-checks ownership + open states (pending/published/reviewing/
    // offered/negotiating) on every accept/reject call.
    const canDecide = !!need && isOwner && ['pending', 'published', 'reviewing', 'offered', 'negotiating'].includes(need.status);

    const decide = async (offerId: string, action: 'accept' | 'reject') => {
        setBusy(true);
        setError(null);
        try {
            await api.post(`/api/need-requests/${need_id}/offers/${offerId}/${action}`);
            load();
        } catch (e) {
            setError(errorMessage(e, 'Could not save your decision'));
        }
        setBusy(false);
    };

    return (
        <AppLayout title="Offers">
            <Head title="Offers" />
            <div className="mx-auto max-w-3xl space-y-6 px-3 py-4">
                <Link href={`/needs/my-needs/${need_id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to need
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Offers</h1>
                    {need && (
                        <p className="mt-1 text-sm text-gray-500">
                            {need.title} ·{' '}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${needStatusClasses(need.status)}`}>
                                {NEED_STATUS_LABELS[need.status]}
                            </span>
                        </p>
                    )}
                    {error && (
                        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
                    )}
                </div>

                {!need && !error && <p className="text-sm text-gray-500">Loading...</p>}

                {need && (need.offers ?? []).length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                        <p className="font-medium text-gray-800 dark:text-gray-200">No offers yet</p>
                        <p className="mt-1 text-sm text-gray-500">Providers will start offering once the request is published.</p>
                    </div>
                )}

                {need && (need.offers ?? []).length > 0 && (
                    <ul className="space-y-3">
                        {(need.offers ?? []).map((offer: NeedOffer) => (
                            <li key={offer.id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            {offer.provider?.name ?? 'Provider'} · {new Date(offer.created_at).toLocaleDateString()}
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                                            {need.currency} {offer.price}
                                        </p>
                                        {offer.message && <p className="mt-2 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">{offer.message}</p>}
                                        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                                            offer.status === 'accepted' ? 'bg-green-100 text-green-700'
                                                : offer.status === 'rejected' ? 'bg-red-100 text-red-700'
                                                    : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {offer.status === 'pending' ? 'Awaiting decision' : offer.status}
                                        </span>
                                    </div>
                                    {canDecide && offer.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                disabled={busy}
                                                data-testid={`offer-accept-${offer.id}`}
                                                onClick={() => decide(offer.id, 'accept')}
                                                className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                                            >
                                                <Check className="h-4 w-4" /> Accept
                                            </button>
                                            <button
                                                type="button"
                                                disabled={busy}
                                                data-testid={`offer-reject-${offer.id}`}
                                                onClick={() => decide(offer.id, 'reject')}
                                                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
                                            >
                                                <X className="h-4 w-4" /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {!isOwner && need && (
                    <p className="text-sm text-gray-500">Only the requester can accept or reject offers.</p>
                )}
            </div>
        </AppLayout>
    );
}
