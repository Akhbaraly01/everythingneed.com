import { statusTone } from '@/lib/lifecycle';
import { EmptyState } from '@/components/shared/Ui';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { formatDate } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { ClipboardList, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface TaskApplication {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'submitted' | 'verified' | 'paid';
    payout?: number | string;
    created_at: string;
    task?: {
        id: string;
        title: string;
        post_number: string;
        budget: number | string;
        status: string;
    };
}

interface Props {
    applications: { data: TaskApplication[]; current_page: number; last_page: number; total: number };
}

const nextStep: Record<string, string> = {
    pending: 'Awaiting the owner’s review',
    approved: 'Open the task and submit your evidence',
    submitted: 'Evidence under review',
    verified: 'Payment being released',
    paid: 'Completed — funds in your payments history',
};

export default function MyTaskApplications({ applications }: Props) {
    return (
        <AppLayout title="My task applications">
            <Head title="My task applications" />
            <div className="mx-auto max-w-3xl px-4 py-8">
                <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
                <p className="mb-6 text-sm text-gray-500">{applications.total} tasks you applied for</p>

                {applications.data.length === 0 ? (
                    <EmptyState
                        icon={<ClipboardList className="h-10 w-10 text-gray-300" />}
                        title="No applications yet"
                        description="Apply to open tasks and track their progress here."
                        action={
                            <Link href="/tasks" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
                                Browse open tasks
                            </Link>
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {applications.data.map((a) => (
                            <Link
                                key={a.id}
                                href={a.task ? `/tasks/${a.task.id}` : '/tasks'}
                                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-violet-300 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{a.task?.title ?? 'Task removed'}</p>
                                    <p className="text-xs text-gray-500">
                                        Applied {formatDate(a.created_at)}
                                        {a.task ? ` · ${formatPrice(Number(a.task.budget))}` : ''}
                                        {' · '}
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(a.status)}`}>{a.status}</span>
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-400">{nextStep[a.status]}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                            </Link>
                        ))}
                    </div>
                )}

                {applications.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        {applications.current_page > 1 && (
                            <Link href={`/tasks/my-applications?page=${applications.current_page - 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white">
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-300">Page {applications.current_page} of {applications.last_page}</span>
                        {applications.current_page < applications.last_page && (
                            <Link href={`/tasks/my-applications?page=${applications.current_page + 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white">
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
