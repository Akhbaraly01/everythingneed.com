import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import {ArrowLeft, CheckCircle2, FileText, ClipboardList, BadgeCheck, Send} from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface TaskApplication {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'submitted' | 'verified' | 'paid';
    message?: string;
    evidence_url?: string;
    evidence_note?: string;
    payout?: number | string;
    created_at: string;
    worker?: { name: string };
}

interface TaskPost {
    id: string;
    post_number: string;
    title: string;
    description?: string;
    quantity: number;
    budget: number | string;
    deadline?: string;
    requirements?: string[];
    status: string;
    applications_count?: number;
    owner?: { name: string };
}

interface Props {
    task: TaskPost;
    isOwner: boolean;
    myApplication?: TaskApplication | null;
    applications?: TaskApplication[] | null;
}

const appStatusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-indigo-100 text-indigo-800',
    rejected: 'bg-red-100 text-red-700',
    submitted: 'bg-cyan-100 text-cyan-800',
    verified: 'bg-green-100 text-green-800',
    paid: 'bg-purple-100 text-purple-800',
};

export default function TaskShow({ task, isOwner, myApplication, applications }: Props) {
    const [busy, setBusy] = useState<string | null>(null);
    const [applyMessage, setApplyMessage] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [evidenceNote, setEvidenceNote] = useState('');

    const act = async (label: string, fn: () => Promise<unknown>) => {
        setBusy(label);
        try {
            await fn();
            toast.success(`${label} successful`);
            router.reload({ only: ['task', 'myApplication', 'applications'] });
        } catch (err) {
            toast.error(errorMessage(err, 'Action failed'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <AppLayout title={task.title}>
            <Head title={`${task.title} — Task Center`} />
            <div className="mx-auto max-w-4xl px-4 py-8">
                <Link href="/tasks" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600">
                    <ArrowLeft className="h-4 w-4" /> Back to board
                </Link>

                {/* Header */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs text-gray-400">{task.post_number}</span>
                        <span className="text-sm font-bold text-violet-600">{formatPrice(Number(task.budget))}</span>
                    </div>
                    <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300">{task.description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Stat label="Quantity" value={String(task.quantity)} />
                        <Stat label="Budget" value={formatPrice(Number(task.budget))} />
                        <Stat label="Deadline" value={task.deadline ? formatDate(task.deadline) : 'Flexible'} />
                        <Stat label="Applicants" value={String(task.applications_count ?? 0)} />
                    </div>
                    {(task.requirements?.length ?? 0) > 0 && (
                        <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/40">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                <FileText className="h-3.5 w-3.5" /> Requirements
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                {task.requirements!.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Worker view */}
                {!isOwner && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white"><ClipboardList className="h-5 w-5" /> Participate</h2>
                        {myApplication ? (
                            <div>
                                <p className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${appStatusStyles[myApplication.status]}`}>
                                    Your application: {myApplication.status}
                                    {['approved', 'submitted'].includes(myApplication.status) && ' — you are assigned to this task'}
                                </p>
                                {myApplication.status === 'pending' && <p className="text-sm text-gray-500">Waiting for the task owner's review.</p>}
                                {myApplication.status === 'rejected' && <p className="text-sm text-gray-500">This time the owner went with another applicant.</p>}
                                {(myApplication.status === 'approved') && (
                                    <SubmitEvidence
                                        evidenceUrl={evidenceUrl} setEvidenceUrl={setEvidenceUrl}
                                        evidenceNote={evidenceNote} setEvidenceNote={setEvidenceNote}
                                        busy={busy === 'submit'}
                                        onSubmit={() => act('Submission', () =>
                                            api.post(`/api/task-applications/${myApplication.id}/submit`, {
                                                evidence_url: evidenceUrl || null,
                                                evidence_note: evidenceNote || null,
                                            }))}
                                    />
                                )}
                                {myApplication.status === 'submitted' && <p className="text-sm text-amber-600">⏳ Evidence submitted — awaiting owner verification.</p>}
                                {myApplication.status === 'verified' && <p className="text-sm text-green-600">✓ Work verified! Payment of {formatPrice(Number(myApplication.payout ?? task.budget))} is being released.</p>}
                                {myApplication.status === 'paid' && (
                                    <p className="flex items-center gap-2 text-sm font-medium text-purple-600">
                                        <BadgeCheck className="h-4 w-4" /> Paid {formatPrice(Number(myApplication.payout ?? task.budget))} — check your payments history.
                                    </p>
                                )}
                            </div>
                        ) : task.status === 'open' ? (
                            <div>
                                <textarea
                                    rows={3}
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                    placeholder="Tell the owner why you're a good fit (optional)…"
                                    className="mb-3 w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                <Button
                                    disabled={busy === 'apply'}
                                    onClick={() => act('Application', () =>
                                        api.post(`/api/tasks/${task.id}/apply`, { message: applyMessage || null }))}
                                >
                                    <Send className="h-4 w-4" /> {busy === 'apply' ? 'Submitting…' : 'Apply for this task'}
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">This task is no longer open for new applicants.</p>
                        )}
                    </div>
                )}

                {/* Owner view */}
                {isOwner && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white"><ClipboardList className="h-5 w-5" /> Applications ({applications?.length ?? 0})</h2>
                        {(applications?.length ?? 0) === 0 ? (
                            <p className="text-sm text-gray-500">No applications yet. They'll appear here as workers apply.</p>
                        ) : (
                            <div className="space-y-3">
                                {applications!.map((a) => (
                                    <div key={a.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-medium text-gray-900 dark:text-white">{a.worker?.name ?? 'Worker'}</span>
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${appStatusStyles[a.status]}`}>{a.status}</span>
                                        </div>
                                        {a.message && <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">“{a.message}”</p>}
                                        {a.evidence_url && (
                                            <a href={a.evidence_url} target="_blank" rel="noreferrer" className="mb-1 block truncate text-xs text-sky-600 hover:underline">
                                                📎 Evidence link: {a.evidence_url}
                                            </a>
                                        )}
                                        {a.evidence_note && <p className="mb-2 text-xs text-gray-500">Note: {a.evidence_note}</p>}

                                        <div className="flex flex-wrap gap-2">
                                            {a.status === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        disabled={!!busy}
                                                        onClick={() => act('Approval', () => api.post(`/api/task-applications/${a.id}/approve`))}
                                                    >
                                                        Approve & assign
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={!!busy}
                                                        onClick={() => act('Rejection', () => api.post(`/api/task-applications/${a.id}/reject`))}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {a.status === 'submitted' && (
                                                <>
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        disabled={!!busy}
                                                        onClick={() => act('Verification', () => api.post(`/api/task-applications/${a.id}/verify`))}
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Verify work
                                                    </Button>
                                                </>
                                            )}
                                            {a.status === 'verified' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={!!busy}
                                                    onClick={() => act('Payment', () => api.post(`/api/task-applications/${a.id}/mark-paid`))}
                                                >
                                                    Release payment ({formatPrice(Number(task.budget))})
                                                </Button>
                                            )}
                                            {a.status === 'paid' && <span className="text-xs text-purple-600 font-medium">✓ Completed & paid</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function SubmitEvidence({ evidenceUrl, setEvidenceUrl, evidenceNote, setEvidenceNote, busy, onSubmit }: {
    evidenceUrl: string; setEvidenceUrl: (v: string) => void;
    evidenceNote: string; setEvidenceNote: (v: string) => void;
    busy: boolean; onSubmit: () => void;
}) {
    return (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/40">
            <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Submit your work</p>
            <input
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="Evidence URL (drive folder, repo, album…)"
                className="mb-2 w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <textarea
                rows={2}
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                placeholder="Notes for the reviewer (what was done, how to verify)…"
                className="mb-3 w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <Button
                size="sm"
                onClick={onSubmit}
                disabled={busy || (!evidenceUrl && !evidenceNote)}
            >
                <Send className="h-3.5 w-3.5" /> {busy ? 'Submitting…' : 'Submit evidence'}
            </Button>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/40">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    );
}
