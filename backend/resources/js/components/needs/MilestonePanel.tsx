import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { useConfirm } from '@/lib/confirm';
import { AlertTriangle, Flag, Landmark, Plus } from 'lucide-react';

export interface Milestone {
    id: string;
    title: string;
    description?: string | null;
    amount: number;
    currency: string;
    sequence: number;
    status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
    funded_at?: string | null;
    released_at?: string | null;
    refunded_at?: string | null;
}

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';

const tone = (status: Milestone['status']) =>
    status === 'released'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        : status === 'refunded'
            ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            : status === 'disputed'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                : status === 'funded'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-300';

const label = (status: Milestone['status']) =>
    ({
        pending: 'Not funded',
        funded: 'Held in escrow',
        released: 'Paid out',
        refunded: 'Refunded',
        disputed: 'In dispute',
    })[status];

/**
 * N-20 milestone escrow ledger.
 *
 * The owner plans the milestones, funds them into escrow and releases
 * them to the provider one by one; either party can escalate a funded
 * milestone into a dispute.
 */
export default function MilestonePanel({
    needId,
    isOwner,
    isProvider,
}: {
    needId: string;
    isOwner: boolean;
    isProvider: boolean;
}) {
    const ask = useConfirm();
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [planning, setPlanning] = useState(false);
    const [disputingId, setDisputingId] = useState<string | null>(null);
    const [disputeSubject, setDisputeSubject] = useState('');
    const [disputeDescription, setDisputeDescription] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<{ data: Milestone[] }>(`/api/need-requests/${needId}/milestones`);
            setMilestones(res.data ?? []);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not load the escrow ledger'));
        } finally {
            setLoading(false);
        }
    }, [needId]);

    useEffect(() => {
        void load();
    }, [load]);

    const act = async (milestone: Milestone, action: 'fund' | 'release' | 'refund') => {
        if (action === 'release') {
            const ok = await ask({
                title: 'Release this milestone?',
                description: `${milestone.currency} ${milestone.amount} is paid to the provider. This cannot be undone.`,
                confirmLabel: 'Release',
                danger: true,
            });
            if (!ok) return;
        }
        if (action === 'refund') {
            const ok = await ask({
                title: 'Refund this milestone?',
                description: `${milestone.currency} ${milestone.amount} goes back to the payer. This cannot be undone.`,
                confirmLabel: 'Refund',
                danger: true,
            });
            if (!ok) return;
        }

        setBusyId(milestone.id);
        try {
            await api.post(`/api/need-requests/${needId}/milestones/${milestone.id}/${action}`);
            toast.success(
                action === 'fund'
                    ? 'Milestone funded into escrow'
                    : action === 'release'
                        ? 'Milestone released to the provider'
                        : 'Milestone refunded',
            );
            await load();
        } catch (e) {
            toast.error(errorMessage(e, 'That milestone action failed'));
        } finally {
            setBusyId(null);
        }
    };

    const openDispute = (milestone: Milestone) => {
        setDisputingId(milestone.id);
        setDisputeSubject('');
        setDisputeDescription('');
    };

    const dispute = async (milestone: Milestone, e: FormEvent) => {
        e.preventDefault();
        if (!disputeSubject.trim() || !disputeDescription.trim()) return;

        setBusyId(milestone.id);
        try {
            await api.post(`/api/need-requests/${needId}/milestones/${milestone.id}/dispute`, {
                subject: disputeSubject.trim(),
                description: disputeDescription.trim(),
            });
            toast.success('Dispute opened — a moderator will arbitrate it');
            setDisputingId(null);
            await load();
        } catch (err) {
            toast.error(errorMessage(err, 'Could not open the dispute'));
        } finally {
            setBusyId(null);
        }
    };

    const plan = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !amount) return;

        setPlanning(true);
        try {
            await api.post(`/api/need-requests/${needId}/milestones`, {
                title: title.trim(),
                amount: Number(amount),
            });
            setTitle('');
            setAmount('');
            toast.success('Milestone planned');
            await load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not plan the milestone'));
        } finally {
            setPlanning(false);
        }
    };

    return (
        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800" aria-label="Milestone escrow">
            <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <Landmark className="h-4 w-4 text-indigo-500" /> Milestone escrow
                </h2>
                <span className="text-xs text-gray-400">{milestones.length} milestone(s)</span>
            </div>

            {milestones.length === 0 && !loading && (
                <p className="mt-3 text-sm text-gray-500">
                    No milestones planned yet — the whole amount settles on completion.
                </p>
            )}

            <ul className="mt-4 space-y-3">
                {milestones.map((milestone) => (
                    <li key={milestone.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {milestone.sequence}. {milestone.title}
                                </p>
                                {milestone.description && (
                                    <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">
                                        {milestone.description}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    {milestone.currency} {milestone.amount}
                                </p>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone(milestone.status)}`}>
                                {label(milestone.status)}
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {isOwner && milestone.status === 'pending' && (
                                <Button
                                    type="button"
                                    size="sm"
                                    loading={busyId === milestone.id}
                                    disabled={busyId !== null}
                                    data-testid={`milestone-fund-${milestone.id}`}
                                    onClick={() => act(milestone, 'fund')}
                                    iconLeft={<Landmark className="h-4 w-4" />}
                                >
                                    Fund into escrow
                                </Button>
                            )}
                            {isOwner && milestone.status === 'funded' && (
                                <>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="success"
                                        loading={busyId === milestone.id}
                                        disabled={busyId !== null}
                                        data-testid={`milestone-release-${milestone.id}`}
                                        onClick={() => act(milestone, 'release')}
                                        iconLeft={<Landmark className="h-4 w-4" />}
                                    >
                                        Release to provider
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        loading={busyId === milestone.id}
                                        disabled={busyId !== null}
                                        data-testid={`milestone-refund-${milestone.id}`}
                                        onClick={() => act(milestone, 'refund')}
                                    >
                                        Refund
                                    </Button>
                                </>
                            )}
                            {isProvider && (milestone.status === 'funded' || milestone.status === 'released') && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    loading={busyId === milestone.id}
                                    disabled={busyId !== null}
                                    data-testid={`milestone-dispute-${milestone.id}`}
                                    onClick={() => openDispute(milestone)}
                                    iconLeft={<Flag className="h-4 w-4" />}
                                >
                                    Dispute
                                </Button>
                            )}
                        </div>

                        {disputingId === milestone.id && (
                            <form onSubmit={(e) => dispute(milestone, e)} className="mt-3 rounded-lg border border-red-200 p-3 dark:border-red-900/60">
                                <div>
                                    <label htmlFor={`dispute-subject-${milestone.id}`} className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                        What is wrong with this milestone?
                                    </label>
                                    <input
                                        id={`dispute-subject-${milestone.id}`}
                                        type="text"
                                        value={disputeSubject}
                                        onChange={(e) => setDisputeSubject(e.target.value)}
                                        maxLength={160}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="mt-2">
                                    <label htmlFor={`dispute-description-${milestone.id}`} className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Describe the issue
                                    </label>
                                    <textarea
                                        id={`dispute-description-${milestone.id}`}
                                        value={disputeDescription}
                                        onChange={(e) => setDisputeDescription(e.target.value)}
                                        rows={3}
                                        maxLength={4000}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        variant="danger"
                                        loading={busyId === milestone.id}
                                        disabled={!disputeSubject.trim() || !disputeDescription.trim()}
                                        data-testid={`milestone-dispute-submit-${milestone.id}`}
                                        iconLeft={<Flag className="h-4 w-4" />}
                                    >
                                        Open dispute
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setDisputingId(null)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </li>
                ))}
            </ul>

            {isOwner && (
                <form onSubmit={plan} className="mt-5 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700">
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <Plus className="h-4 w-4 text-indigo-500" /> Plan a milestone
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                            <label htmlFor="milestone-title" className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                Milestone
                            </label>
                            <input
                                id="milestone-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={160}
                                placeholder="e.g. Kitchen and bathroom"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="milestone-amount" className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                Amount
                            </label>
                            <input
                                id="milestone-amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <AlertTriangle className="h-3 w-3" /> The plan can never exceed the agreed price.
                    </p>
                    <Button
                        type="submit"
                        size="sm"
                        loading={planning}
                        disabled={!title.trim() || !amount}
                        data-testid="milestone-plan-submit"
                        className="mt-3"
                        iconLeft={<Plus className="h-4 w-4" />}
                    >
                        Add milestone
                    </Button>
                </form>
            )}
        </section>
    );
}
