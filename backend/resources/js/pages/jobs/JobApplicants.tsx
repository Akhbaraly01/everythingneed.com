import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Users, Mail, RefreshCcw } from 'lucide-react';

interface ApplicantRow {
    id: string;
    status: string;
    cover_letter?: string | null;
    created_at: string;
    job_post?: { id?: string; title?: string; company?: string } | null;
    user?: { id?: string; name?: string; email?: string } | null;
}

interface JobApplicantsProps {
    job_id: string;
}

const STATUSES = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

export default function JobApplicants({ job_id }: JobApplicantsProps) {
    const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
    const [jobTitle, setJobTitle] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        Promise.all([
            api.get<{ data: ApplicantRow[] }>(`/api/jobs/${job_id}/applications`),
            api.get<{ data: { title?: string } }>(`/api/jobs/${job_id}`).catch(() => ({ data: {} as { title?: string } })),
        ])
            .then(([apps, job]) => {
                setApplicants(apps.data ?? []);
                setJobTitle(job.data?.title ?? 'Applicants');
            })
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load applicants'));
                setApplicants([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, [job_id]);

    const setStatus = async (applicationId: string, status: string) => {
        setUpdatingId(applicationId);
        setError(null);
        try {
            await api.patch(`/api/jobs/applications/${applicationId}`, { status });
            load();
        } catch (e) {
            setError(errorMessage(e, 'Update failed'));
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <AppLayout title="Applicants">
            <Head title="Applicants" />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                            <Users className="h-6 w-6" /> Applicants
                        </h1>
                        <p className="text-sm text-gray-500">{jobTitle}</p>
                    </div>
                    <Link href="/jobs/my-jobs" className="text-sm text-indigo-600 hover:underline">← My jobs</Link>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error && applicants.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button onClick={load} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : applicants.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No applicants yet</h3>
                        <p className="mt-1 text-sm text-gray-500">When people apply, they show up here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {applicants.map((a) => (
                            <div key={a.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-gray-900 dark:text-white">
                                            {a.user?.name ?? 'Applicant'}
                                            {a.user?.email && (
                                                <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-gray-400">
                                                    <Mail className="h-3 w-3" /> {a.user.email}
                                                </span>
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-400">Applied {formatDateTime(a.created_at)}</p>
                                        {a.cover_letter && (
                                            <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{a.cover_letter}</p>
                                        )}
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                        a.status === 'hired' ? 'bg-green-100 text-green-800' :
                                        a.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        a.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {a.status}
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {STATUSES.filter((s) => s !== a.status).map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatus(a.id, status)}
                                            disabled={updatingId === a.id}
                                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium capitalize hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                                        >
                                            {status}
                                        </button>
                                    ))}
                                    <Link href={`/jobs/applications/${a.id}`} className="ml-auto text-xs font-medium text-indigo-600 hover:underline">
                                        Open detail →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
