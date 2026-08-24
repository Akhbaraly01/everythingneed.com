import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search as SearchIcon, ListChecks, Plus, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

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
    created_at: string;
    owner?: { name: string };
}

interface Props {
    tasks: { data: TaskPost[]; current_page: number; last_page: number; total: number };
    filters: { q?: string; mine?: string };
}

const statusStyles: Record<string, string> = {
    open: 'bg-green-100 text-green-800',
    in_review: 'bg-amber-100 text-amber-800',
    assigned: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-700',
};

export default function TasksIndex({ tasks, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const mine = filters.mine === '1';

    const search = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/tasks', q ? { q } : {}, { preserveState: true });
    };

    return (
        <AppLayout title="Task Center">
            <Head title="Task Center" />
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">
                            <ListChecks className="h-6 w-6 text-violet-600" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Center</h1>
                            <p className="text-sm text-gray-500">{tasks.total} open tasks — participate and earn</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/tasks/my-applications" className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                            <ClipboardList className="h-4 w-4" /> My Applications
                        </Link>
                        <Link href="/tasks/create" className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
                            <Plus className="h-4 w-4" /> Post a Task
                        </Link>
                    </div>
                </div>

                {/* Toggle + search */}
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-600">
                        <button
                            onClick={() => router.get('/tasks', {}, { preserveState: true })}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium ${!mine ? 'bg-violet-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            Open tasks
                        </button>
                        <button
                            onClick={() => router.get('/tasks', { mine: '1' }, { preserveState: true })}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium ${mine ? 'bg-violet-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            My posts
                        </button>
                    </div>
                    <form onSubmit={search} className="relative min-w-60 flex-1">
                        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search tasks…"
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </form>
                </div>

                {/* List */}
                {tasks.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600">
                        <ListChecks className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">{mine ? "You haven't posted any tasks yet" : 'No open tasks right now'}</p>
                        <Link href="/tasks/create" className="mt-3 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
                            Post the first one
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.data.map((task) => (
                            <Link
                                key={task.id}
                                href={`/tasks/${task.id}`}
                                className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-violet-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="font-mono text-[11px] text-gray-400">{task.post_number}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[task.status] ?? ''}`}>{task.status.replace('_', ' ')}</span>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                                        <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{task.description}</p>
                                        <p className="mt-1.5 text-xs text-gray-400">
                                            by {task.owner?.name ?? 'Unknown'} · posted {formatDate(task.created_at)}
                                            {task.deadline ? ` · due ${formatDate(task.deadline)}` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-violet-600">{formatCurrency(Number(task.budget))}</p>
                                        <p className="text-xs text-gray-500">Qty {task.quantity} · {task.applications_count ?? 0} applicant{((task.applications_count ?? 0)) === 1 ? '' : 's'}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {tasks.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        {tasks.current_page > 1 && (
                            <Link href={`/tasks?page=${tasks.current_page - 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white">
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-300">Page {tasks.current_page} of {tasks.last_page}</span>
                        {tasks.current_page < tasks.last_page && (
                            <Link href={`/tasks?page=${tasks.current_page + 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white">
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
