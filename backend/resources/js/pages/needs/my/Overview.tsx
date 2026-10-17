import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { NEED_STATUS_LABELS, acceptedOffer, needDetailUrl, needStatusClasses } from '@/lib/needs';
import { Button } from '@/components/shared/Button';
import { useConfirm } from '@/lib/confirm';
import {
    ArrowLeft, ArrowRight, CreditCard, Eye, MapPin, MessageSquare,
    Navigation, Star, Users, ClipboardList,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { NeedRequestDetail } from '@/types';

/**
 * Spec S14 - /needs/my-needs/{id}: the requester's workspace hub. Every
 * lifecycle button posts a server-authorized transition (spec S13) and the
 * sub-pages (offers/messages/payment/tracking/review) hang off this shell.
 */
export default function MyNeedOverview({ need_id }: { need_id: string }) {
    const { auth } = usePage().props as { auth?: { user?: { id: string; name?: string } } };
    const ask = useConfirm();
    const [need, setNeed] = useState<NeedRequestDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        api.get<{ data: NeedRequestDetail }>(`/api/need-requests/${need_id}`)
            .then((res) => setNeed(res.data))
            .catch((e) => setError(errorMessage(e, 'Could not load this need')));
    }, [need_id]);

    useEffect(() => {
        load();
    }, [load]);

    const act = async (action: string) => {
        setBusy(true);
        setError(null);
        try {
            await api.post(`/api/need-requests/${need_id}/${action}`);
            load();
        } catch (e) {
            setError(errorMessage(e, 'Action failed'));
        }
        setBusy(false);
    };

    // TODO 18 duplicate-as-draft (server copies the brief, never history).
    const duplicate = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await api.post<{ data: { id: string } }>(`/api/need-requests/${need_id}/duplicate`);
            window.location.href = `/needs/my-needs/${res.data.id}`;
        } catch (e) {
            setError(errorMessage(e, 'Could not duplicate'));
        }
        setBusy(false);
    };

    // TODO 18 visibility: going public always works; invite-only is
    // server-gated on invitees.
    const makePublic = async () => {
        if (!(await ask({ title: 'Make this request visible to all eligible providers?' }))) return;
        setBusy(true);
        setError(null);
        try {
            await api.post(`/api/need-requests/${need_id}/visibility`, { visibility: 'public' });
            load();
        } catch (e) {
            setError(errorMessage(e, 'Could not change visibility'));
        }
        setBusy(false);
    };

    if (!need && !error) {
        return (
            <AppLayout title="My need">
                <Head title="My need" />
                <div className="mx-auto max-w-3xl px-3 py-8 text-sm text-gray-500">Loading...</div>
            </AppLayout>
        );
    }

    if (!need) {
        return (
            <AppLayout title="My need">
                <Head title="My need" />
                <div className="mx-auto max-w-3xl px-3 py-8">
                    <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
                    <Link href="/needs/my-needs" className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                        <ArrowLeft className="h-4 w-4" /> Back to My Needs
                    </Link>
                </div>
            </AppLayout>
        );
    }

    const isOwner = auth?.user?.id === need.user_id;
    const offer = acceptedOffer(need);
    const isProvider = !!offer && auth?.user?.id === offer.provider_id;
    const s = need.status;

    const subPages = [
        { href: `/needs/my-needs/${need.id}/offers`, label: 'Offers', icon: Users, show: isOwner },
        { href: `/needs/my-needs/${need.id}/messages`, label: 'Messages', icon: MessageSquare, show: isOwner || isProvider },
        { href: `/needs/my-needs/${need.id}/payment`, label: 'Payment', icon: CreditCard, show: isOwner || isProvider },
        { href: `/needs/my-needs/${need.id}/tracking`, label: 'Tracking', icon: Navigation, show: true },
        { href: `/needs/my-needs/${need.id}/review`, label: 'Review', icon: Star, show: isOwner && s === 'completed' },
    ].filter((p) => p.show);

    const ownerActions: { action: string; label: string; primary?: boolean }[] = [];
    if (isOwner) {
        if (s === 'draft') ownerActions.push({ action: 'submit', label: 'Submit for review', primary: true });
        if (s === 'pending') ownerActions.push({ action: 'publish', label: 'Publish', primary: true });
        if (s === 'accepted') ownerActions.push({ action: 'payment', label: 'Proceed to payment', primary: true });
        if (['pending', 'published', 'reviewing', 'offered', 'negotiating', 'payment_pending'].includes(s)) {
            ownerActions.push({ action: 'cancel', label: 'Cancel' });
            ownerActions.push({ action: 'expire', label: 'Mark expired' });
        }
        if (['paid', 'in_progress', 'fulfilled'].includes(s)) ownerActions.push({ action: 'dispute', label: 'Raise dispute' });
    }
    const providerActions: { action: string; label: string; primary?: boolean }[] = [];
    if (isProvider) {
        if (s === 'paid') providerActions.push({ action: 'start', label: 'Start work', primary: true });
        if (s === 'in_progress') providerActions.push({ action: 'fulfill', label: 'Submit delivered work', primary: true });
        if (['in_progress', 'fulfilled'].includes(s)) providerActions.push({ action: 'complete', label: 'Mark complete', primary: true });
        if (['paid', 'in_progress', 'fulfilled'].includes(s)) providerActions.push({ action: 'dispute', label: 'Raise dispute' });
    }

    const allActions = [...ownerActions, ...providerActions];

    return (
        <AppLayout title="My need">
            <Head title={`My need - ${need.title}`} />
            <div className="mx-auto max-w-3xl space-y-6 px-3 py-4">
                <Link href="/needs/my-needs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> My Needs
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${needStatusClasses(need.status)}`}>
                            {NEED_STATUS_LABELS[need.status]}
                        </span>
                        <span className="text-xs text-gray-400">#{need.request_number}</span>
                    </div>
                    <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{need.title}</h1>
                    <p className="mt-2 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">{need.description}</p>

                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        {need.budget_max != null && (
                            <div><dt className="text-gray-500">Budget</dt><dd className="font-medium">{need.currency} {need.budget_min} - {need.budget_max}</dd></div>
                        )}
                        {need.location && (
                            <div className="flex items-start gap-1"><dt className="sr-only">Location</dt><dd className="flex items-center gap-1 text-gray-700 dark:text-gray-300"><MapPin className="h-4 w-4" /> {need.location}</dd></div>
                        )}
                        {need.deadline && (
                            <div><dt className="text-gray-500">Deadline</dt><dd className="font-medium">{new Date(need.deadline).toLocaleDateString()}</dd></div>
                        )}
                        <div><dt className="text-gray-500">Created</dt><dd className="font-medium">{new Date(need.created_at).toLocaleDateString()}</dd></div>
                    </dl>

                    {error && (
                        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
                    )}

                    {allActions.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {allActions.map((a) => (
                                <Button
                                    key={a.action}
                                    type="button"
                                    disabled={busy}
                                    data-testid={`need-action-${a.action}`}
                                    onClick={() => act(a.action)}
                                    variant={a.primary ? 'primary' : 'outline'}
                                    className="rounded-md px-4 py-2"
                                >
                                    {a.label}
                                </Button>
                            ))}
                            {isOwner && ['draft', 'pending'].includes(s) && (
                                <Link
                                    href={`/needs/request?edit=${need.id}`}
                                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600"
                                >
                                    Edit
                                </Link>
                            )}
                            {isOwner && (
                                <Button
                                    type="button"
                                    disabled={busy}
                                    onClick={duplicate}
                                    variant="outline"
                                    className="rounded-md px-4 py-2"
                                >
                                    Duplicate as draft
                                </Button>
                            )}
                        </div>
                    )}
                    {isOwner && need.visibility === 'invite_only' && (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                Invitation-only — visible to {need.invited_provider_ids?.length ?? 0} invited provider(s).
                            </p>
                            <button
                                onClick={makePublic}
                                disabled={busy}
                                className="mt-2 rounded border border-amber-300 px-3 py-1 text-xs font-medium hover:bg-amber-100 dark:border-amber-700"
                            >
                                Make public
                            </button>
                        </div>
                    )}
                </div>

                {/* Spec S14 sub-pages */}
                <nav aria-label="Need workspace" className="grid gap-3 sm:grid-cols-2">
                    {subPages.map((p) => (
                        <Link
                            key={p.href}
                            href={p.href}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-800 transition hover:border-indigo-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <span className="flex items-center gap-2"><p.icon className="h-4 w-4 text-indigo-500" /> {p.label}</span>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                        </Link>
                    ))}
                    <Link
                        href={needDetailUrl(need)}
                        className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 p-4 text-sm font-medium text-gray-600 hover:border-indigo-400 dark:border-gray-600 dark:text-gray-300"
                    >
                        <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> Public detail view</span>
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </nav>

                {/* Timeline preview (spec S12) */}
                <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                        <ClipboardList className="h-4 w-4 text-indigo-500" /> Activity
                    </h2>
                    <ol className="mt-3 space-y-2">
                        {(need.timeline ?? []).slice(0, 6).map((ev) => (
                            <li key={ev.id} className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-gray-700 dark:text-gray-300">
                                    {ev.action}{ev.actor?.name ? ` · ${ev.actor.name}` : ''}
                                </span>
                                <time className="text-xs text-gray-400" dateTime={ev.created_at}>
                                    {new Date(ev.created_at).toLocaleString()}
                                </time>
                            </li>
                        ))}
                        {(need.timeline ?? []).length === 0 && (
                            <li className="text-sm text-gray-500">No activity yet.</li>
                        )}
                    </ol>
                </section>
            </div>
        </AppLayout>
    );
}
