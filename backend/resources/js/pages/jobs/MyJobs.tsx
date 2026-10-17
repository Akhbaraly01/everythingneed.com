import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Briefcase, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface Job {
    id: string;
    title: string;
    company: string;
    company_profile?: { slug?: string } | null;
    location: string;
    is_active: boolean;
    applications_count?: number;
    created_at: string;
}

export default function MyJobs() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Job[] }>('/api/jobs?mine=1&per_page=50')
            .then((res) => setJobs(Array.isArray(res.data) ? res.data : []))
            .catch((e) => setError(errorMessage(e, 'Failed to load your jobs')))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="My Jobs">
            <Head title="My Jobs" />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Jobs</h1>
                    <div className="flex items-center gap-3">
                        <Link href="/jobs/company" className="text-sm font-medium text-indigo-600 hover:underline">
                            Company profile
                        </Link>
                        <Link href="/jobs/create" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            <Plus className="h-4 w-4" /> Post a job
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading your jobs...</p>
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">{error}</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">You have not posted any job yet.</p>
                    </div>
                ) : (
                    <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                        {jobs.map((job) => (
                            <div key={job.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{job.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {job.company} · {job.applications_count ?? 0} applications · {formatDateTime(job.created_at)}
                                    </p>
                                </Link>
                                <div className="flex shrink-0 items-center gap-3">
                                    {job.company_profile?.slug && (
                                        <Link href={`/companies/${job.company_profile.slug}`} className="text-xs font-medium text-indigo-600 hover:underline">
                                            Company
                                        </Link>
                                    )}
                                    <Link href={`/jobs/${job.id}/applicants`} className="text-xs font-medium text-indigo-600 hover:underline">
                                        Applicants ({job.applications_count ?? 0})
                                    </Link>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${job.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                        {job.is_active ? 'Active' : 'Closed'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
