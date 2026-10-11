import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useEffect, useState } from 'react';
import {Briefcase, FileText, RefreshCcw} from 'lucide-react';

interface JobAppRow {
    id: string;
    status: string;
    created_at: string;
    job_post?: { id?: string; title?: string; company?: string };
    job_id?: string;
}

interface TaskAppRow {
    id: string;
    status: string;
    created_at: string;
    task_post?: { id?: string; title?: string };
    task?: { id?: string; title?: string };
    task_post_id?: string;
}

interface AppItem {
    id: string;
    job_post?: { title: string; company: string };
    task_post?: { title: string };
    status: string;
    created_at: string;
    tab?: 'jobs' | 'tasks';
    link?: string;
}

export default function AccountApplications() {
    const [jobs, setJobs] = useState<AppItem[]>([]);
    const [tasks, setTasks] = useState<AppItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'jobs' | 'tasks'>('jobs');

    const load = () => {
        setLoading(true);
        setError(null);
        Promise.all([
            api.get<{ data: JobAppRow[] }>('/api/jobs/my-applications'),
            api.get<{ data: TaskAppRow[] }>('/api/my-task-applications'),
        ]).then(([j, t]) => {
            setJobs(((j as { data?: JobAppRow[] }).data ?? []).map((row) => ({
                id: row.id,
                status: row.status,
                created_at: row.created_at,
                job_post: row.job_post
                    ? { title: row.job_post.title ?? 'Job', company: row.job_post.company ?? '' }
                    : undefined,
                tab: 'jobs' as const,
                link: row.job_post?.id ? `/jobs/${row.job_post.id}` : '/jobs',
            })));
            setTasks(((t as { data?: TaskAppRow[] }).data ?? []).map((row) => {
                const task = row.task_post ?? row.task;
                return {
                    id: row.id,
                    status: row.status,
                    created_at: row.created_at,
                    task_post: task
                        ? { title: task.title ?? 'Task' }
                        : undefined,
                    tab: 'tasks' as const,
                    link: task?.id ? `/tasks/${task.id}` : '/tasks',
                };
            }));
        }).catch((e) => {
            setError(errorMessage(e, 'Failed to load applications'));
            setJobs([]);
            setTasks([]);
        }).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const list = tab === 'jobs' ? jobs : tasks;

    return (
        <AppLayout title="My Applications">
            <Head title="My Applications" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Briefcase className="h-6 w-6" /> My Applications</h1>
                <div className="flex gap-2">
                    <button onClick={() => setTab('jobs')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'jobs' ? 'bg-blue-600 text-white' : 'bg-white border dark:bg-gray-800 dark:border-gray-600'}`}>Jobs ({jobs.length})</button>
                    <button onClick={() => setTab('tasks')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-white border dark:bg-gray-800 dark:border-gray-600'}`}>Tasks ({tasks.length})</button>
                </div>
                {loading ? <p className="text-gray-500">Loading...</p> : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={load} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : list.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No applications yet</p>
                        <Link href={tab === 'jobs' ? '/jobs' : '/tasks'} className="mt-4 inline-block text-blue-600 hover:underline">Browse {tab}</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {list.map((a) => (
                            <Link key={a.id} href={a.link ?? '#'}
                                className="block rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800">
                                <p className="font-semibold dark:text-white">{a.job_post?.title || a.task_post?.title || 'Application'}</p>
                                {a.job_post && <p className="text-sm text-gray-500">{a.job_post.company}</p>}
                                <div className="mt-2 flex justify-between text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs ${a.status === 'hired' || a.status === 'approved' ? 'bg-green-100 text-green-800' : a.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{a.status}</span>
                                    <span className="text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
