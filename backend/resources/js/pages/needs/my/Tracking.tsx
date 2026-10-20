import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { NEED_STATUS_LABELS, needStatusClasses } from '@/lib/needs';
import { Button } from '@/components/shared/Button';
import { useConfirm } from '@/lib/confirm';
import { ArrowLeft, Check, CircleDot, ClipboardList, GitCompare, Navigation, Send, X } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import type { NeedRequestDetail } from '@/types';

interface ScopeChange {
    id: string;
    requested_by: string;
    summary: string;
    price_effect: number | string | null;
    time_effect?: string | null;
    status: 'proposed' | 'accepted' | 'rejected';
    decided_at?: string | null;
    created_at: string;
    requester?: { id: string; name: string } | null;
}

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';

const scopeTone = (status: ScopeChange['status']) =>
    status === 'accepted'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        : status === 'rejected'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';

/**
 * Spec S14 /needs/my-needs/{id}/tracking: the delivery lifecycle as a
 * timeline - every state change recorded server-side (spec S12 activity).
 * TODO 15 fulfillment: the accepted provider narrates progress and proposes
 * scope changes here; the requester reviews and decides (counterparty rule).
 */
export default function MyNeedTracking({ need_id }: { need_id: string }) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const ask = useConfirm();
    const [need, setNeed] = useState<NeedRequestDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [accepting, setAccepting] = useState(false);
    // TODO 13 booking slot (owner/provider view; null when never booked).
    const [booking, setBooking] = useState<{
        scheduled_start: string;
        scheduled_end: string;
        timezone?: string | null;
        status: string;
        provider?: { name?: string | null } | null;
    } | null>(null);
    const [scopeChanges, setScopeChanges] = useState<ScopeChange[]>([]);
    const [note, setNote] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [postingProgress, setPostingProgress] = useState(false);
    const [summary, setSummary] = useState('');
    const [priceEffect, setPriceEffect] = useState('');
    const [timeEffect, setTimeEffect] = useState('');
    const [proposing, setProposing] = useState(false);
    const [decidingId, setDecidingId] = useState<string | null>(null);

    const loadNeed = useCallback(() => {
        api.get<{ data: NeedRequestDetail }>(`/api/need-requests/${need_id}`)
            .then((res) => setNeed(res.data))
            .catch((e) => setError(errorMessage(e, 'Could not load tracking')));
    }, [need_id]);

    // Owner, accepted provider and admin only — anyone else gets a 403 and
    // simply sees the empty state.
    const loadScopeChanges = useCallback(() => {
        api.get<{ data: ScopeChange[] }>(`/api/need-requests/${need_id}/scope-changes`)
            .then((res) => setScopeChanges(rows(res)))
            .catch(() => setScopeChanges([]));
    }, [need_id]);

    useEffect(() => {
        loadNeed();
        loadScopeChanges();
        api.get<{ data: typeof booking }>(`/api/need-requests/${need_id}/bookings`)
            .then((res) => setBooking(res.data ?? null))
            .catch(() => setBooking(null));
    }, [need_id, loadNeed, loadScopeChanges]);

    // TODO 15 owner acceptance of delivered work (releases the payout).
    const acceptWork = async () => {
        if (!(await ask({ title: 'Accept the delivered work?', description: 'This releases the payout and cannot be undone.', danger: true }))) return;
        setAccepting(true);
        try {
            await api.post(`/api/need-requests/${need_id}/accept`);
            toast.success('Work accepted.');
            const res = await api.get<{ data: NeedRequestDetail }>(`/api/need-requests/${need_id}`);
            setNeed(res.data);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not accept the work'));
        } finally {
            setAccepting(false);
        }
    };

    const viewerId = auth?.user?.id;
    const isOwner = !!need && viewerId === need.user_id;
    // `show` strips competing offers for non-owners, so the accepted provider
    // only ever sees their own row - matched by id + accepted status.
    const isAcceptedProvider =
        !!need &&
        !!viewerId &&
        viewerId !== need.user_id &&
        (need.offers ?? []).some((o) => o.provider_id === viewerId && o.status === 'accepted');
    const canPostProgress = !!need && isAcceptedProvider && need.status === 'in_progress';
    const canProposeScope =
        !!need && isAcceptedProvider && ['accepted', 'paid', 'in_progress', 'fulfilled'].includes(need.status);

    const postProgress = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = note.trim();
        if (!trimmed) return;
        setPostingProgress(true);
        try {
            const payload: { note: string; evidence_url?: string } = { note: trimmed };
            const url = evidenceUrl.trim();
            if (url) payload.evidence_url = url;
            await api.post(`/api/need-requests/${need_id}/progress`, payload);
            toast.success('Progress update posted.');
            setNote('');
            setEvidenceUrl('');
            loadNeed();
        } catch (err) {
            toast.error(errorMessage(err, 'Could not post the progress update'));
        } finally {
            setPostingProgress(false);
        }
    };

    const proposeChange = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedSummary = summary.trim();
        if (!trimmedSummary) {
            toast.error('Describe what is changing.');
            return;
        }
        const payload: { summary: string; price_effect?: number; time_effect?: string } = { summary: trimmedSummary };
        const price = priceEffect.trim();
        if (price !== '') {
            const value = Number(price);
            if (!Number.isFinite(value) || value < 0) {
                toast.error('Enter a valid price effect.');
                return;
            }
            payload.price_effect = value;
        }
        const time = timeEffect.trim();
        if (time !== '') payload.time_effect = time;

        setProposing(true);
        try {
            await api.post(`/api/need-requests/${need_id}/scope-changes`, payload);
            toast.success('Scope change proposed.');
            setSummary('');
            setPriceEffect('');
            setTimeEffect('');
            loadScopeChanges();
            loadNeed();
        } catch (err) {
            toast.error(errorMessage(err, 'Could not propose the scope change'));
        } finally {
            setProposing(false);
        }
    };

    // The server refuses any decision from the proposer - mirror that rule
    // client-side so the buttons only show for the counterparty.
    const canDecide = (change: ScopeChange) =>
        change.status === 'proposed' &&
        !!viewerId &&
        change.requested_by !== viewerId &&
        (isOwner || isAcceptedProvider);

    const decide = async (change: ScopeChange, decision: 'accept' | 'reject') => {
        const ok = await ask({
            title: decision === 'accept' ? 'Approve this scope change?' : 'Reject this scope change?',
            description:
                decision === 'accept'
                    ? change.price_effect != null
                        ? `The agreed price moves to ${change.price_effect} and the new terms take effect.`
                        : 'The new terms take effect immediately.'
                    : 'The proposal is declined and the original terms stay in place.',
            danger: decision === 'reject',
        });
        if (!ok) return;
        setDecidingId(change.id);
        try {
            const res = await api.post<{ message?: string }>(`/api/need-scope-changes/${change.id}/${decision}`);
            toast.success(res.message ?? 'Decision saved.');
            loadScopeChanges();
            loadNeed();
        } catch (err) {
            toast.error(errorMessage(err, 'Could not save your decision'));
        } finally {
            setDecidingId(null);
        }
    };

    const order = [
        'draft', 'pending', 'published', 'offered', 'negotiating', 'accepted',
        'payment_pending', 'paid', 'in_progress', 'fulfilled', 'completed',
    ];
    const currentIndex = need ? order.indexOf(need.status) : -1;

    return (
        <AppLayout title="Tracking">
            <Head title="Tracking" />
            <div className="mx-auto max-w-3xl space-y-6 px-3 py-4">
                <Link href={`/needs/my-needs/${need_id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to need
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                        <Navigation className="h-5 w-5 text-indigo-500" /> Tracking
                    </h1>
                    {error && (
                        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
                    )}

                    {need && (
                        <>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${needStatusClasses(need.status)}`}>
                                    {NEED_STATUS_LABELS[need.status]}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-300">{need.title}</span>
                            </div>

                            {/* Progress strip for the happy path; terminal/failure states show as-is */}
                            {currentIndex >= 0 && (
                                <ol className="mt-5 flex flex-wrap gap-1" aria-label="Progress">
                                    {order.slice(0, currentIndex + 1).map((st, i) => (
                                        <li key={st} className="flex items-center gap-1">
                                            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                {NEED_STATUS_LABELS[st as keyof typeof NEED_STATUS_LABELS]}
                                            </span>
                                            {i < currentIndex && <span className="text-[10px] text-gray-400">→</span>}
                                        </li>
                                    ))}
                                </ol>
                            )}

                            {['cancelled', 'rejected', 'expired', 'refunded', 'disputed'].includes(need.status) && (
                                <p className="mt-3 text-sm text-gray-500">
                                    This request left the standard flow (current state: {NEED_STATUS_LABELS[need.status]}).
                                </p>
                            )}

                            {isOwner && need.status === 'fulfilled' && (
                                <div className="mt-4">
                                    <button
                                        onClick={acceptWork}
                                        disabled={accepting}
                                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {accepting ? 'Accepting…' : 'Accept work & release payout'}
                                    </button>
                                </div>
                            )}

                            {booking && booking.status === 'scheduled' && (
                                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-900/20">
                                    <p className="font-semibold text-green-800 dark:text-green-200">Booked slot</p>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {new Date(booking.scheduled_start).toLocaleString()} – {new Date(booking.scheduled_end).toLocaleString()}
                                        {booking.timezone ? ` (${booking.timezone})` : ''}
                                    </p>
                                    {booking.provider?.name && (
                                        <p className="text-gray-600 dark:text-gray-400">with {booking.provider.name}</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {need && isAcceptedProvider && (
                    <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800" aria-label="Fulfillment">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Your work on this need</h2>

                        <div className="mt-4">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                <ClipboardList className="h-4 w-4 text-indigo-500" /> Post progress update
                            </h3>
                            {canPostProgress ? (
                                <form onSubmit={postProgress} className="mt-3 space-y-3">
                                    <div>
                                        <label htmlFor="progress-note" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Progress note *
                                        </label>
                                        <textarea
                                            id="progress-note"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            rows={3}
                                            maxLength={2000}
                                            placeholder="What has been done since the last update?"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="progress-evidence" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Evidence link (optional)
                                        </label>
                                        <input
                                            id="progress-evidence"
                                            type="url"
                                            value={evidenceUrl}
                                            onChange={(e) => setEvidenceUrl(e.target.value)}
                                            maxLength={500}
                                            placeholder="https://…"
                                            className={inputClass}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        loading={postingProgress}
                                        disabled={!note.trim()}
                                        data-testid="progress-submit"
                                        iconLeft={<Send className="h-4 w-4" />}
                                    >
                                        Post update
                                    </Button>
                                </form>
                            ) : (
                                <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                                    Progress updates open once the work is In progress (currently {NEED_STATUS_LABELS[need.status]}).
                                </p>
                            )}
                        </div>

                        <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-700">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                <GitCompare className="h-4 w-4 text-indigo-500" /> Propose scope change
                            </h3>
                            {canProposeScope ? (
                                <form onSubmit={proposeChange} className="mt-3 space-y-3">
                                    <div>
                                        <label htmlFor="scope-summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            What is changing? *
                                        </label>
                                        <textarea
                                            id="scope-summary"
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                            rows={3}
                                            maxLength={2000}
                                            placeholder="e.g. Balcony deep clean added at the requester's request."
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="scope-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Price effect ({need.currency} · optional)
                                            </label>
                                            <input
                                                id="scope-price"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={priceEffect}
                                                onChange={(e) => setPriceEffect(e.target.value)}
                                                placeholder="e.g. 40"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="scope-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Time effect (optional)
                                            </label>
                                            <input
                                                id="scope-time"
                                                type="text"
                                                value={timeEffect}
                                                onChange={(e) => setTimeEffect(e.target.value)}
                                                maxLength={255}
                                                placeholder="e.g. +1 day"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Nothing changes until the other party approves — the original terms stay in place until then.
                                    </p>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        loading={proposing}
                                        disabled={!summary.trim()}
                                        data-testid="scope-propose-submit"
                                        iconLeft={<GitCompare className="h-4 w-4" />}
                                    >
                                        Propose change
                                    </Button>
                                </form>
                            ) : (
                                <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                                    Scope changes apply while the work is active (currently {NEED_STATUS_LABELS[need.status]}).
                                </p>
                            )}
                        </div>
                    </section>
                )}

                {need && (isOwner || isAcceptedProvider) && (
                    <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800" aria-label="Scope changes">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                                <GitCompare className="h-4 w-4 text-indigo-500" /> Scope changes
                            </h2>
                            {scopeChanges.length > 0 && <span className="text-xs text-gray-400">{scopeChanges.length} proposed</span>}
                        </div>

                        {scopeChanges.length === 0 && (
                            <p className="mt-3 text-sm text-gray-500">No scope changes proposed yet.</p>
                        )}

                        <ul className="mt-4 space-y-3">
                            {scopeChanges.map((change) => (
                                <li key={change.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                {change.requester?.name ? `${change.requester.name} · ` : ''}
                                                <time dateTime={change.created_at}>{new Date(change.created_at).toLocaleString()}</time>
                                            </p>
                                            <p className="mt-1 whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">{change.summary}</p>
                                            <p className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                                                {change.price_effect != null && (
                                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">
                                                        Price {need.currency} {change.price_effect}
                                                    </span>
                                                )}
                                                {change.time_effect && (
                                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">Time {change.time_effect}</span>
                                                )}
                                            </p>
                                            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${scopeTone(change.status)}`}>
                                                {change.status === 'proposed' ? 'Awaiting decision' : change.status}
                                            </span>
                                            {change.status !== 'proposed' && change.decided_at && (
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Decided <time dateTime={change.decided_at}>{new Date(change.decided_at).toLocaleString()}</time>
                                                </p>
                                            )}
                                        </div>
                                        {canDecide(change) && (
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="success"
                                                    loading={decidingId === change.id}
                                                    disabled={decidingId !== null}
                                                    data-testid={`scope-accept-${change.id}`}
                                                    onClick={() => decide(change, 'accept')}
                                                    iconLeft={<Check className="h-4 w-4" />}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    loading={decidingId === change.id}
                                                    disabled={decidingId !== null}
                                                    data-testid={`scope-reject-${change.id}`}
                                                    onClick={() => decide(change, 'reject')}
                                                    iconLeft={<X className="h-4 w-4" />}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {need && (
                    <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Activity history</h2>
                        <ol className="mt-4 space-y-0">
                            {(need.timeline ?? []).length === 0 && (
                                <li className="text-sm text-gray-500">No activity recorded yet.</li>
                            )}
                            {(need.timeline ?? []).map((ev, idx, all) => (
                                <li key={ev.id} className="relative flex gap-3 pb-5 last:pb-0">
                                    {idx < all.length - 1 && (
                                        <span className="absolute left-[7px] top-5 h-full w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                    )}
                                    <CircleDot className="relative mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {ev.action}
                                            {ev.action === 'progress' && (
                                                <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                    progress note
                                                </span>
                                            )}
                                            {ev.from_status && (
                                                <span className="text-gray-400"> · {ev.from_status} → {ev.to_status}</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {ev.actor?.name ? `${ev.actor.name} · ` : ''}
                                            <time dateTime={ev.created_at}>{new Date(ev.created_at).toLocaleString()}</time>
                                        </p>
                                        {ev.note && (
                                            <p
                                                className={`mt-1 whitespace-pre-line text-xs ${
                                                    ev.action === 'progress'
                                                        ? 'rounded-md bg-amber-50 p-2 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {ev.note}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
