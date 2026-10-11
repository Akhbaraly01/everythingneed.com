import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Briefcase, Clock, CheckCircle, XCircle, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ApplicationRow {
    id: string;
    job_id?: string;
    status: string;
    created_at: string;
    updated_at: string;
    job_post?: { id?: string; title?: string; company?: string };
}

interface Application {
    id: string;
    job_id: string;
    job_title: string;
    company?: string;
    status: string;
    applied_at: string;
    updated_at: string;
}

function mapApplication(row: ApplicationRow): Application {
    return {
        id: row.id,
        job_id: row.job_id ?? row.job_post?.id ?? '',
        job_title: row.job_post?.title ?? 'Job application',
        company: row.job_post?.company,
        status: row.status,
        applied_at: row.created_at,
        updated_at: row.updated_at,
    };
}

const statusIcons: Record<string, typeof Clock> = {
    pending: Clock,
    reviewed: Clock,
    shortlisted: CheckCircle,
    rejected: XCircle,
    hired: CheckCircle,
};

export default function JobApplications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: ApplicationRow[] }>('/api/jobs/my-applications')
            .then((res) => setApplications((res.data ?? []).map(mapApplication)))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load applications'));
                setApplications([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    return (
        <AppLayout title="My Applications">
            <Head title="Job Applications" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
                    <Link href="/jobs" className="text-sm text-indigo-600 hover:underline">Browse Jobs</Link>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={load} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No applications yet</h3>
                        <Link href="/jobs" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Browse Jobs</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {applications.map((a) => {
                            const Icon = statusIcons[a.status] ?? Clock;
                            return (
                                <Link key={a.id} href={`/jobs/${a.job_id}`}
                                    className="flex items-center justify-between rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{a.job_title}</p>
                                        {a.company && <p className="text-sm text-gray-500">{a.company}</p>}
                                        <p className="text-xs text-gray-400">Applied {formatDateTime(a.applied_at)}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                                        a.status === 'hired' ? 'bg-green-100 text-green-800' :
                                        a.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        a.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        <Icon className="h-3 w-3" /> {a.status}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
