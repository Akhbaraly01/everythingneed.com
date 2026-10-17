import { statusTone } from '@/lib/lifecycle';
import { EmptyState } from '@/components/shared/Ui';
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { type WorkRequest, type WorkOffer } from '@/types';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { ArrowLeft, Star, XCircle, BadgeDollarSign, Check, Handshake } from 'lucide-react';
import { Button, buttonClasses } from '@/components/shared/Button';

interface Props {
    requests: { data: WorkRequest[]; current_page: number; last_page: number; total: number };
}

export default function MyWorkRequests({ requests }: Props) {
    const [busyId, setBusyId] = useState<string | null>(null);
    const [ratingFor, setRatingFor] = useState<string | null>(null);
    const [rating, setRating] = useState(5);

    const act = async (request: WorkRequest, action: () => Promise<unknown>, successMsg: string) => {
        setBusyId(request.id);
        try {
            await action();
            toast.success(successMsg);
            router.reload({ only: ['requests'] });
        } catch (err) {
            toast.error(errorMessage(err, 'Action failed'));
        } finally {
            setBusyId(null);
        }
    };

    const pendingOffer = (request: WorkRequest): WorkOffer | undefined =>
        request.offers?.find((o) => o.status === 'pending' && o.proposed_by === 'worker');

    return (
        <AppLayout title="My work requests">
            <Head title="My work requests" />
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Link href="/job-seekers" className="mb-1 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600">
                            <ArrowLeft className="h-4 w-4" /> Browse workers
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Requests</h1>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {requests.total} total
                    </span>
                </div>

                {requests.data.length === 0 ? (
                    <EmptyState
                        icon={<Handshake className="h-10 w-10 text-gray-300" />}
                        title="No requests yet"
                        description="Find a worker and send your first request."
                        action={
                            <Link href="/job-seekers" className={buttonClasses('primary', 'md')}>
                                Browse directory
                            </Link>
                        }
                    />
                ) : (
                    <div className="space-y-4">
                        {requests.data.map((req) => {
                            const offer = pendingOffer(req);
                            return (
                                <div key={req.id} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{req.title}</h3>
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone(req.status)}`}>{req.status.replace('_', ' ')}</span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {req.worker_profile?.user?.name ?? 'Open to offers'} · created {formatDate(req.created_at)}
                                                {req.agreed_rate ? ` · agreed ${formatPrice(Number(req.agreed_rate))}` : ''}
                                            </p>
                                        </div>
                                        {!['cancelled', 'completed'].includes(req.status) && (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                disabled={busyId === req.id}
                                                onClick={() => act(req, () => api.post(`/api/work-requests/${req.id}/cancel`), 'Request cancelled')}
                                            >
                                                <XCircle className="h-3.5 w-3.5" /> Cancel
                                            </Button>
                                        )}
                                    </div>

                                    {/* Negotiation: incoming worker offer */}
                                    {offer && (
                                        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                                            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-900 dark:text-amber-200">
                                                <Handshake className="h-4 w-4" />
                                                Offer received: {formatPrice(Number(offer.rate))}
                                                {offer.message && <span className="font-normal">— “{offer.message}”</span>}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    disabled={busyId === req.id}
                                                    onClick={() => act(
                                                        req,
                                                        () => api.post(`/api/work-offers/${offer.id}/respond`, { decision: 'accept' }),
                                                        'Offer accepted — proceed to payment',
                                                    )}
                                                >
                                                    Accept offer
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={busyId === req.id}
                                                    onClick={() => act(
                                                        req,
                                                        () => api.post(`/api/work-offers/${offer.id}/respond`, { decision: 'reject' }),
                                                        'Offer rejected',
                                                    )}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lifecycle actions */}
                                    <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                                        {req.status === 'accepted' && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                disabled={busyId === req.id}
                                                onClick={() => act(req, () => api.post(`/api/work-requests/${req.id}/pay`), 'Marked as paid')}
                                            >
                                                <BadgeDollarSign className="h-3.5 w-3.5" /> Mark as paid ({formatPrice(Number(req.agreed_rate ?? 0))})
                                            </Button>
                                        )}
                                        {req.status === 'in_progress' && (
                                            <span className="rounded-lg bg-cyan-50 px-3 py-1.5 text-xs text-cyan-700">Work in progress — the worker will mark it complete.</span>
                                        )}
                                        {req.status === 'completed' && !req.rated_at && (
                                            ratingFor === req.id ? (
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((n) => (
                                                        <Button key={n} variant="icon" iconOnly size="sm" aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`} onClick={() => setRating(n)}>
                                                            <Star className={`h-6 w-6 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                        </Button>
                                                    ))}
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="ml-2"
                                                        disabled={busyId === req.id}
                                                        onClick={() => act(
                                                            req,
                                                            () => api.post(`/api/work-requests/${req.id}/rate`, { rating }),
                                                            'Rating recorded — thank you!',
                                                        ).then(() => setRatingFor(null))}
                                                    >
                                                        <Check className="h-3 w-3" /> Submit
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => { setRatingFor(req.id); setRating(5); }}
                                                >
                                                    <Star className="h-3.5 w-3.5" /> Rate this worker
                                                </Button>
                                            )
                                        )}
                                        {req.status === 'completed' && req.rated_at && (
                                            <span className="text-xs text-green-600">✓ Rated — thank you for the feedback.</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {requests.last_page > 1 && (
                    <div className="mt-8 flex justify-center gap-3">
                        {requests.current_page > 1 && (
                            <Link href={`/job-seekers/my-requests?page=${requests.current_page - 1}`} preserveState className={buttonClasses('outline', 'sm')}>
                                Previous
                            </Link>
                        )}
                        <span className="self-center text-sm text-gray-500">Page {requests.current_page} of {requests.last_page}</span>
                        {requests.current_page < requests.last_page && (
                            <Link href={`/job-seekers/my-requests?page=${requests.current_page + 1}`} preserveState className={buttonClasses('outline', 'sm')}>
                                Next
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
