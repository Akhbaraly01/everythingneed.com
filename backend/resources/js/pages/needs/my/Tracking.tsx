import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { NEED_STATUS_LABELS, needStatusClasses } from '@/lib/needs';
import { useConfirm } from '@/lib/confirm';
import { ArrowLeft, CircleDot, Navigation } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { NeedRequestDetail } from '@/types';

/**
 * Spec S14 /needs/my-needs/{id}/tracking: the delivery lifecycle as a
 * timeline - every state change recorded server-side (spec S12 activity).
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

    useEffect(() => {
        api.get<{ data: NeedRequestDetail }>(`/api/need-requests/${need_id}`)
            .then((res) => setNeed(res.data))
            .catch((e) => setError(errorMessage(e, 'Could not load tracking')));
        api.get<{ data: typeof booking }>(`/api/need-requests/${need_id}/bookings`)
            .then((res) => setBooking(res.data ?? null))
            .catch(() => setBooking(null));
    }, [need_id]);

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

    const isOwner = !!need && auth?.user?.id === need.user_id;

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
                                            {ev.from_status && (
                                                <span className="text-gray-400"> · {ev.from_status} → {ev.to_status}</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {ev.actor?.name ? `${ev.actor.name} · ` : ''}
                                            <time dateTime={ev.created_at}>{new Date(ev.created_at).toLocaleString()}</time>
                                        </p>
                                        {ev.note && <p className="mt-1 text-xs text-gray-500">{ev.note}</p>}
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
