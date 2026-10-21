import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { Check, Clock, Wallet, X } from 'lucide-react';

export interface Timesheet {
    id: string;
    work_date: string;
    minutes: number;
    hours: number;
    hourly_rate: number;
    amount: number;
    currency: string;
    note?: string | null;
    status: 'submitted' | 'approved' | 'rejected' | 'paid';
    approved_at?: string | null;
}

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white';

const tone = (status: Timesheet['status']) =>
    status === 'paid'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        : status === 'approved'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            : status === 'rejected'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                : 'bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-300';

const label = (status: Timesheet['status']) =>
    ({
        submitted: 'Awaiting approval',
        approved: 'Approved',
        rejected: 'Rejected',
        paid: 'Paid',
    })[status];

/**
 * N-25 hourly timesheet ledger.
 *
 * The provider logs the hours worked each day, the owner approves them
 * and pays the approved hours in one go.
 */
export default function TimesheetPanel({
    needId,
    isOwner,
    isProvider,
}: {
    needId: string;
    isOwner: boolean;
    isProvider: boolean;
}) {
    const [entries, setEntries] = useState<Timesheet[]>([]);
    const [summary, setSummary] = useState({ approved_minutes: 0, approved_amount: 0 });
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [paying, setPaying] = useState(false);
    const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10));
    const [minutes, setMinutes] = useState('');
    const [note, setNote] = useState('');
    const [logging, setLogging] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<{ data: Timesheet[]; summary: typeof summary }>(
                `/api/need-requests/${needId}/timesheets`,
            );
            setEntries(res.data ?? []);
            if (res.summary) setSummary(res.summary);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not load the timesheets'));
        } finally {
            setLoading(false);
        }
    }, [needId]);

    useEffect(() => {
        void load();
    }, [load]);

    const decide = async (entry: Timesheet, action: 'approve' | 'reject') => {
        setBusyId(entry.id);
        try {
            await api.post(`/api/need-requests/${needId}/timesheets/${entry.id}/${action}`);
            toast.success(action === 'approve' ? 'Hours approved' : 'Hours rejected');
            await load();
        } catch (e) {
            toast.error(errorMessage(e, 'That timesheet action failed'));
        } finally {
            setBusyId(null);
        }
    };

    const pay = async () => {
        setPaying(true);
        try {
            const res = await api.post<{ data: { paid: unknown[]; failed: unknown[] } }>(
                `/api/need-requests/${needId}/timesheets/pay`,
            );
            const paid = res.data?.paid?.length ?? 0;
            const failed = res.data?.failed?.length ?? 0;
            toast.success(failed === 0 ? `Paid ${paid} timesheet(s)` : `Paid ${paid}, ${failed} failed`);
            await load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not pay the approved hours'));
        } finally {
            setPaying(false);
        }
    };

    const log = async (e: FormEvent) => {
        e.preventDefault();
        if (!workDate || !minutes) return;

        setLogging(true);
        try {
            await api.post(`/api/need-requests/${needId}/timesheets`, {
                work_date: workDate,
                minutes: Number(minutes),
                note: note.trim() || undefined,
            });
            setMinutes('');
            setNote('');
            toast.success('Hours logged');
            await load();
        } catch (err) {
            toast.error(errorMessage(err, 'Could not log the hours'));
        } finally {
            setLogging(false);
        }
    };

    const hasApproved = entries.some((entry) => entry.status === 'approved');

    return (
        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800" aria-label="Hourly timesheets">
            <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <Clock className="h-4 w-4 text-indigo-500" /> Hourly timesheets
                </h2>
                {summary.approved_minutes > 0 && (
                    <span className="text-xs text-gray-400">
                        {Math.round((summary.approved_minutes / 60) * 100) / 100}h approved ·{' '}
                        {summary.approved_amount}
                    </span>
                )}
            </div>

            {entries.length === 0 && !loading && (
                <p className="mt-3 text-sm text-gray-500">No hours logged yet.</p>
            )}

            <ul className="mt-4 space-y-3">
                {entries.map((entry) => (
                    <li key={entry.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {entry.work_date} · {entry.hours}h
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    {entry.currency} {entry.amount} ({entry.currency} {entry.hourly_rate}/h)
                                </p>
                                {entry.note && (
                                    <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">
                                        {entry.note}
                                    </p>
                                )}
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone(entry.status)}`}>
                                {label(entry.status)}
                            </span>
                        </div>

                        {isOwner && entry.status === 'submitted' && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="success"
                                    loading={busyId === entry.id}
                                    disabled={busyId !== null}
                                    data-testid={`timesheet-approve-${entry.id}`}
                                    onClick={() => decide(entry, 'approve')}
                                    iconLeft={<Check className="h-4 w-4" />}
                                >
                                    Approve
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    loading={busyId === entry.id}
                                    disabled={busyId !== null}
                                    data-testid={`timesheet-reject-${entry.id}`}
                                    onClick={() => decide(entry, 'reject')}
                                    iconLeft={<X className="h-4 w-4" />}
                                >
                                    Reject
                                </Button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {isOwner && hasApproved && (
                <Button
                    type="button"
                    size="sm"
                    className="mt-4"
                    loading={paying}
                    data-testid="timesheet-pay-submit"
                    onClick={pay}
                    iconLeft={<Wallet className="h-4 w-4" />}
                >
                    Pay approved hours
                </Button>
            )}

            {isProvider && (
                <form onSubmit={log} className="mt-5 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Log the hours you worked</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                            <label htmlFor="timesheet-date" className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                Date
                            </label>
                            <input
                                id="timesheet-date"
                                type="date"
                                value={workDate}
                                onChange={(e) => setWorkDate(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="timesheet-minutes" className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                Minutes
                            </label>
                            <input
                                id="timesheet-minutes"
                                type="number"
                                min="1"
                                max="1440"
                                value={minutes}
                                onChange={(e) => setMinutes(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div className="mt-3">
                        <label htmlFor="timesheet-note" className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            What did you do?
                        </label>
                        <input
                            id="timesheet-note"
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={2000}
                            className={inputClass}
                        />
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        loading={logging}
                        disabled={!workDate || !minutes}
                        data-testid="timesheet-log-submit"
                        className="mt-3"
                        iconLeft={<Clock className="h-4 w-4" />}
                    >
                        Log hours
                    </Button>
                </form>
            )}
        </section>
    );
}
