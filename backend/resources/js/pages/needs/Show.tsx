import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { NEED_STATUS_LABELS, acceptedOffer, needStatusClasses } from '@/lib/needs';
import {
    ArrowLeft, Calendar, ClipboardList, DollarSign, FileText, Image as ImageIcon,
    MapPin, MessageSquare, Paperclip, User,
} from 'lucide-react';
import Image from '@/components/shared/Image';
import { Button } from '@/components/shared/Button';
import { useCallback, useEffect, useState } from 'react';
import type { NeedOffer, NeedRequestDetail, NeedStatus } from '@/types';

interface ShowProps {
    need_id?: string;
    category_slug?: string;
}

interface WorkroomFile {
    id: string;
    original_name: string;
    size: number | null;
    mime?: string | null;
    created_at: string;
    uploaded_by: { id: string; name: string | null };
    can_delete: boolean;
}

const OPEN_FOR_OFFERS: NeedStatus[] = ['pending', 'published', 'reviewing', 'offered', 'negotiating'];

/**
 * Spec S12 - need detail. Canonical URL is /needs/{category}/{id}; hitting
 * it with a stale slug replaces the history entry with the canonical one.
 * Everything a viewer may do (offer, decide, pay, workflow) is role-aware
 * and every failure surfaces the server's real reason (spec S98).
 */
export default function NeedShow({ need_id, category_slug }: ShowProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string }; roles?: string[] } };
    const fallbackId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : undefined;
    const id = need_id || fallbackId;

    const [need, setNeed] = useState<NeedRequestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // Provider offer form
    const [offerPrice, setOfferPrice] = useState('');
    const [offerMessage, setOfferMessage] = useState('');
    const [offerFlash, setOfferFlash] = useState<string | null>(null);

    // N-24 workroom: shared files for engaged parties only.
    const [workFiles, setWorkFiles] = useState<WorkroomFile[]>([]);
    const [workUploading, setWorkUploading] = useState(false);

    const load = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get<{ data: NeedRequestDetail }>(`/api/need-requests/${id}`);
            const n = res.data;

            // Canonical slug (spec S12): correct the URL without stacking history.
            if (category_slug && n.category?.slug && n.category.slug !== category_slug) {
                router.visit(`/needs/${n.category.slug}/${n.id}`, { replace: true, preserveScroll: true });
            }
            setNeed(n);
        } catch (e) {
            setError(errorMessage(e, 'Request not found'));
        } finally {
            setLoading(false);
        }
    }, [id, category_slug]);

    useEffect(() => {
        load();
    }, [load]);

    const me = auth?.user?.id;
    const isOwner = !!need && !!me && need.user_id === me;
    const offers = need?.offers ?? [];
    const offer = need ? acceptedOffer(need) : undefined;
    const isProvider = !!need && !!me && (offer?.provider_id === me || offers.some((o) => o.provider_id === me));
    const isModerator = ['super_admin', 'administrator', 'needs_admin', 'platform_ops'].some((r) => (auth?.roles ?? []).includes(r));
    const s = need?.status;

    // N-24: the room opens for the owner, moderators, and the ACCEPTED
    // provider — pending bidders never see the section at all.
    const isWorkroomParty = isOwner || isModerator || (!!offer && offer.provider_id === me);

    const loadFiles = useCallback(async () => {
        if (!id || !isWorkroomParty) return;
        try {
            const res = await api.get<{ data: WorkroomFile[] }>(`/api/need-requests/${id}/files`);
            setWorkFiles(res.data ?? []);
        } catch {
            setWorkFiles([]);
        }
    }, [id, isWorkroomParty]);

    useEffect(() => {
        if (need) loadFiles();
    }, [need, loadFiles]);

    const uploadWorkFile = async (f: File | null | undefined) => {
        if (!f || !id) return;
        setWorkUploading(true);
        setError(null);
        try {
            const fd = new FormData();
            fd.append('file', f);
            await api.post(`/api/need-requests/${id}/files`, fd);
            await loadFiles();
        } catch (e) {
            setError(errorMessage(e, 'Upload failed'));
        } finally {
            setWorkUploading(false);
        }
    };

    const downloadWorkFile = async (f: WorkroomFile) => {
        try {
            const res = await api.get<{ data: { url: string } }>(`/api/need-requests/${id}/files/${f.id}/url`);
            window.open(res.data.url, '_blank', 'noopener');
        } catch (e) {
            setError(errorMessage(e, 'Could not open the file'));
        }
    };

    const removeWorkFile = async (f: WorkroomFile) => {
        try {
            await api.del(`/api/need-requests/${id}/files/${f.id}`);
            await loadFiles();
        } catch (e) {
            setError(errorMessage(e, 'Could not remove the file'));
        }
    };

    const decide = async (offerId: string, action: 'accept' | 'reject') => {
        setBusy(true);
        setError(null);
        try {
            await api.post(`/api/need-requests/${id}/offers/${offerId}/${action}`);
            await load();
        } catch (e) {
            setError(errorMessage(e, 'Could not save your decision'));
        }
        setBusy(false);
    };

    const submitOffer = async () => {
        if (!offerPrice || Number(offerPrice) <= 0) {
            setError('Enter a valid offer amount.');
            return;
        }
        setBusy(true);
        setError(null);
        setOfferFlash(null);
        try {
            const res = await api.post<{ message?: string }>(`/api/need-requests/${id}/offers`, {
                price: Number(offerPrice),
                message: offerMessage.trim() || undefined,
            });
            setOfferFlash(res.message ?? 'Offer submitted');
            setOfferPrice('');
            setOfferMessage('');
            await load();
        } catch (e) {
            setError(errorMessage(e, 'Could not submit your offer'));
        }
        setBusy(false);
    };

    const act = async (path: string) => {
        setBusy(true);
        setError(null);
        try {
            await api.post(`/api/need-requests/${id}/${path}`);
            await load();
        } catch (e) {
            setError(errorMessage(e, 'Action failed'));
        }
        setBusy(false);
    };

    if (loading) {
        return (
            <AppLayout title="Need Details">
                <Head title="Need Details" />
                <p className="p-12 text-center text-gray-500">Loading...</p>
            </AppLayout>
        );
    }

    if (!need) {
        return (
            <AppLayout title="Need Details">
                <Head title="Need Details" />
                <div className="p-12 text-center">
                    <p role="alert" className="text-red-500">{error ?? 'Request not found'}</p>
                    <Link href="/needs" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">Back to Needs</Link>
                </div>
            </AppLayout>
        );
    }

    const ownerActions: { path: string; label: string; primary?: boolean }[] = [];
    if (isOwner) {
        if (s === 'draft') ownerActions.push({ path: 'submit', label: 'Submit for review', primary: true });
        if (s === 'pending') ownerActions.push({ path: 'publish', label: 'Publish', primary: true });
        if (s === 'accepted') ownerActions.push({ path: 'pay', label: 'Pay now', primary: true });
        if (['pending', 'published', 'reviewing', 'offered', 'negotiating', 'payment_pending'].includes(s ?? '')) {
            ownerActions.push({ path: 'cancel', label: 'Cancel' });
            ownerActions.push({ path: 'expire', label: 'Mark expired' });
        }
        if (['paid', 'in_progress', 'fulfilled'].includes(s ?? '')) ownerActions.push({ path: 'dispute', label: 'Raise dispute' });
    }
    const providerActions: { path: string; label: string; primary?: boolean }[] = [];
    if (isProvider && !isOwner) {
        if (s === 'paid') providerActions.push({ path: 'start', label: 'Start work', primary: true });
        if (s === 'in_progress') providerActions.push({ path: 'fulfill', label: 'Submit delivered work', primary: true });
        if (['in_progress', 'fulfilled'].includes(s ?? '')) providerActions.push({ path: 'complete', label: 'Mark complete', primary: true });
        if (['paid', 'in_progress', 'fulfilled'].includes(s ?? '')) providerActions.push({ path: 'dispute', label: 'Raise dispute' });
    }
    const modActions: { path: string; label: string }[] = [];
    if (isModerator && !isOwner) {
        if (['pending', 'published', 'reviewing', 'offered', 'negotiating'].includes(s ?? '')) modActions.push({ path: 'reject', label: 'Reject' });
        if (s === 'disputed') modActions.push({ path: 'refund', label: 'Refund' });
    }

    const ownStandingOffer = offers.find((o) => o.provider_id === me && o.status !== 'accepted');
    // Offer form: anyone non-owner while the request is open, except a
    // provider whose offer was already accepted (server rejects re-bids).
    const canOffer = !!me && !isOwner && OPEN_FOR_OFFERS.includes(s ?? 'draft') && !offers.some((o) => o.provider_id === me && o.status === 'accepted');
    const canCounter = !!ownStandingOffer;
    const allActions = [...ownerActions, ...providerActions, ...modActions.map((a) => ({ ...a, primary: false }))];

    return (
        <AppLayout title={need.title}>
            <Head title={need.title} />
            <div className="mx-auto max-w-3xl space-y-6 px-3 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href="/needs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-4 w-4" /> All Needs
                    </Link>
                    {isOwner && (
                        <Link href={`/needs/my-needs/${need.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                            Open my workspace →
                        </Link>
                    )}
                </div>

                {/* Header */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${needStatusClasses(need.status)}`}>
                            {NEED_STATUS_LABELS[need.status]}
                        </span>
                        <span className="text-sm text-gray-500">#{need.request_number}</span>
                        {need.category && (
                            <Link href={`/needs/${need.category.slug}`} className="text-xs font-medium text-indigo-600 hover:underline">
                                {need.category.name}
                            </Link>
                        )}
                    </div>

                    <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{need.title}</h1>

                    {need.user && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                            <User className="h-4 w-4" /> Posted by {need.user.name}
                        </p>
                    )}

                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300">{need.description}</p>

                    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        {(need.budget_min != null || need.budget_max != null) && (
                            <div className="rounded bg-gray-50 p-3 dark:bg-gray-700">
                                <dt className="flex items-center gap-1 text-gray-500"><DollarSign className="h-3 w-3" /> Budget</dt>
                                <dd className="font-semibold dark:text-white">
                                    {need.currency} {need.budget_min ?? 0}{need.budget_max != null ? ` - ${need.budget_max}` : '+'}
                                </dd>
                            </div>
                        )}
                        <div className="rounded bg-gray-50 p-3 dark:bg-gray-700">
                            <dt className="flex items-center gap-1 text-gray-500"><MapPin className="h-3 w-3" /> Location</dt>
                            <dd className="font-semibold dark:text-white">
                                {need.is_remote
                                    ? 'Remote / online'
                                    : [need.city, need.lga, need.state, need.country].filter(Boolean).join(', ') || need.location || 'Anywhere'}
                            </dd>
                        </div>
                        <div className="rounded bg-gray-50 p-3 dark:bg-gray-700">
                            <dt className="flex items-center gap-1 text-gray-500"><Calendar className="h-3 w-3" /> Deadline</dt>
                            <dd className="font-semibold dark:text-white">{need.is_asap ? 'ASAP' : need.deadline ? new Date(need.deadline).toLocaleDateString() : 'Flexible'}</dd>
                        </div>
                        {need.quantity != null && (
                            <div className="rounded bg-gray-50 p-3 dark:bg-gray-700">
                                <dt className="text-gray-500">Quantity</dt>
                                <dd className="font-semibold dark:text-white">{need.quantity}</dd>
                            </div>
                        )}
                    </dl>

                    {(need.service_requirements || need.delivery_requirements || need.notes) && (
                        <div className="mt-4 space-y-2 text-sm">
                            {need.service_requirements && (
                                <div><span className="font-semibold text-gray-700 dark:text-gray-300">Service requirements: </span><span className="text-gray-600 dark:text-gray-400">{need.service_requirements}</span></div>
                            )}
                            {need.delivery_requirements && (
                                <div><span className="font-semibold text-gray-700 dark:text-gray-300">Delivery requirements: </span><span className="text-gray-600 dark:text-gray-400">{need.delivery_requirements}</span></div>
                            )}
                            {need.notes && (
                                <div><span className="font-semibold text-gray-700 dark:text-gray-300">Notes: </span><span className="text-gray-600 dark:text-gray-400">{need.notes}</span></div>
                            )}
                        </div>
                    )}

                    {/* Category answers (TODO 05): labels come from the submitted snapshot */}
                    {!!need.answers && Object.keys(need.answers).length > 0 && (
                        <div className="mt-4 space-y-2 text-sm">
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Request details</h2>
                            {(need.form_schema_snapshot ?? []).map((field) => {
                                const value = (need.answers as Record<string, unknown>)[field.key];
                                if (value === undefined || value === null || value === '') return null;
                                return (
                                    <div key={field.key}>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{field.label}: </span>
                                        <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Images + attachments */}
                    {(need.images?.length || need.attachments?.length) ? (
                        <div className="mt-5 space-y-3">
                            {!!need.images?.length && (
                                <div>
                                    <h2 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400"><ImageIcon className="h-3.5 w-3.5" /> Images</h2>
                                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                        {need.images.map((src) => (
                                            <a key={src} href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                                <Image src={src} alt="Request attachment" className="h-24 w-full object-cover" loading="lazy" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!!need.attachments?.length && (
                                <div>
                                    <h2 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400"><Paperclip className="h-3.5 w-3.5" /> Documents</h2>
                                    <ul className="mt-2 flex flex-wrap gap-2">
                                        {need.attachments.map((src) => (
                                            <li key={src}>
                                                <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs hover:underline dark:bg-gray-700">
                                                    <FileText className="h-3 w-3" />
                                                    {src.split('/').pop() ?? 'Document'}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {error && (
                    <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
                )}
                {offerFlash && (
                    <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">{offerFlash}</p>
                )}

                {/* Workflow actions */}
                {allActions.length > 0 && (
                    <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Actions</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {allActions.map((a) => (
                                <Button
                                    key={a.path}
                                    type="button"
                                    disabled={busy}
                                    data-testid={`need-action-${a.path}`}
                                    onClick={() => act(a.path)}
                                    variant={a.primary ? 'primary' : 'outline'}
                                >
                                    {a.label}
                                </Button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Provider offer / negotiation */}
                {canOffer && (
                    <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Make an offer</h2>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr]">
                            <div>
                                <label htmlFor="offer-price" className="block text-xs font-medium text-gray-500">Your price ({need.currency})</label>
                                <input
                                    id="offer-price"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={offerPrice}
                                    onChange={(e) => setOfferPrice(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="offer-message" className="block text-xs font-medium text-gray-500">Message (optional)</label>
                                <textarea
                                    id="offer-message"
                                    value={offerMessage}
                                    onChange={(e) => setOfferMessage(e.target.value)}
                                    rows={2}
                                    maxLength={2000}
                                    placeholder="Why you're the right fit..."
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                        <Button
                            type="button"
                            onClick={submitOffer}
                            loading={busy}
                            data-testid="offer-submit"
                            className="mt-3"
                        >
                            Submit offer
                        </Button>
                        {canCounter && (
                            <p className="mt-2 text-xs text-gray-500">Re-submitting updates your standing offer - the request enters Negotiation.</p>
                        )}
                    </section>
                )}

                {/* Offers */}
                <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                        <DollarSign className="h-4 w-4" /> Offers ({offers.length})
                    </h2>
                    <div className="mt-3 space-y-3">
                        {offers.length === 0 && (
                            <p className="text-sm text-gray-500">No offers yet. Providers will respond soon.</p>
                        )}
                        {offers.map((o: NeedOffer) => (
                            <div key={o.id} className="rounded-lg border p-4 dark:border-gray-600">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold text-gray-800 dark:text-white">{o.provider?.name ?? 'Provider'}</span>
                                    <span className="font-bold text-green-600">{need.currency} {o.price}</span>
                                </div>
                                {/* N-27: applicant availability + vetting flags */}
                                {(o.provider_is_available !== null && o.provider_is_available !== undefined) && (
                                    <span
                                        data-testid={`offer-availability-${o.id}`}
                                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                                            o.provider_is_available
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                        }`}
                                    >
                                        {o.provider_is_available ? 'Available now' : 'Paused'}
                                    </span>
                                )}
                                {o.message && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{o.message}</p>}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                        o.status === 'accepted' ? 'bg-green-100 text-green-800'
                                            : o.status === 'rejected' ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {o.status === 'pending' ? 'Awaiting decision' : o.status}
                                    </span>
                                    {isOwner && o.status === 'pending' && OPEN_FOR_OFFERS.includes(s ?? 'draft') && (
                                        <span className="inline-flex gap-2">
                                            <Button
                                                type="button"
                                                disabled={busy}
                                                data-testid={`offer-accept-${o.id}`}
                                                onClick={() => decide(o.id, 'accept')}
                                                variant="success"
                                                size="sm"
                                            >
                                                Accept Offer
                                            </Button>
                                            <Button
                                                type="button"
                                                disabled={busy}
                                                data-testid={`offer-reject-${o.id}`}
                                                onClick={() => decide(o.id, 'reject')}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Reject
                                            </Button>
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* N-24 workroom — parties only; URLs are minted per download */}
                {isWorkroomParty && (
                    <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800" data-testid="workroom">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                            <Paperclip className="h-4 w-4" /> Workroom ({workFiles.length})
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Shared files for this request — visible only to the owner, the accepted provider, and moderators.
                        </p>

                        <div className="mt-3 space-y-2">
                            {workFiles.length === 0 && (
                                <p className="text-sm text-gray-500">No files yet.</p>
                            )}
                            {workFiles.map((f) => (
                                <div
                                    key={f.id}
                                    data-testid={`workroom-file-${f.id}`}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 dark:border-gray-600"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{f.original_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {f.size != null ? `${Math.max(1, Math.round(f.size / 1024))} KB · ` : ''}
                                            {f.uploaded_by?.name ?? 'Unknown'} · {new Date(f.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => downloadWorkFile(f)}>
                                            Download
                                        </Button>
                                        {f.can_delete && (
                                            <Button type="button" size="sm" variant="danger" onClick={() => removeWorkFile(f)}>
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                            <input
                                type="file"
                                className="hidden"
                                data-testid="workroom-upload"
                                disabled={workUploading}
                                onChange={(e) => {
                                    void uploadWorkFile(e.target.files?.[0]);
                                    e.target.value = '';
                                }}
                            />
                            {workUploading ? 'Uploading…' : 'Upload file'}
                        </label>
                    </section>
                )}

                {/* Payment state (owner/admin only per server) */}
                {need.payment && (
                    <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Payment</h2>
                        <dl className="mt-2 space-y-1 text-sm">
                            <div className="flex justify-between"><dt className="text-gray-500">Reference</dt><dd className="font-mono">{need.payment.reference}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-500">Amount</dt><dd>{need.payment.currency} {need.payment.amount}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="capitalize">{need.payment.status}</dd></div>
                        </dl>
                    </section>
                )}

                {/* Timeline (spec S12) */}
                <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                        <ClipboardList className="h-4 w-4" /> Activity
                    </h2>
                    <ol className="mt-3 space-y-2">
                        {(need.timeline ?? []).length === 0 && (
                            <li className="text-sm text-gray-500">No activity yet.</li>
                        )}
                        {(need.timeline ?? []).map((ev) => (
                            <li key={ev.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <span className="text-gray-700 dark:text-gray-300">
                                    {ev.action}
                                    {ev.from_status ? ` · ${ev.from_status} → ${ev.to_status}` : ` · ${ev.to_status}`}
                                    {ev.actor?.name ? ` · ${ev.actor.name}` : ''}
                                </span>
                                <time className="text-xs text-gray-400" dateTime={ev.created_at}>{new Date(ev.created_at).toLocaleString()}</time>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Quick links */}
                <div className="flex flex-wrap gap-3 text-sm">
                    {(isOwner || isProvider) && (
                        <Link href={`/needs/my-needs/${need.id}/messages`} className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                            <MessageSquare className="h-4 w-4" /> Messages
                        </Link>
                    )}
                    {isOwner && (
                        <Link href={`/needs/my-needs/${need.id}`} className="text-indigo-600 hover:underline">
                            Workspace (offers / payment / tracking)
                        </Link>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
