import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface Application {
    id: string;
    status: string;
    cover_letter?: string | null;
    created_at: string;
    job_post?: { id: string; title: string; user_id: string } | null;
    user?: { id: string; name: string; email: string } | null;
}

interface DetailProps {
    application_id: string;
}

const NEXT = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

export default function ApplicationDetail({ application_id }: DetailProps) {
    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);

    const load = () => {
        setLoading(true);
        api.get<{ data: Application }>(`/api/jobs/applications/${application_id}`)
            .then((res) => setApplication(res.data))
            .catch((e) => setError(errorMessage(e, 'Application not found')))
            .finally(() => setLoading(false));
    };

    useEffect(load, [application_id]);

    const setStatus = async (status: string) => {
        setUpdating(true);
        setError(null);
        try {
            await api.patch(`/api/jobs/applications/${application_id}`, { status });
            load();
        } catch (e) {
            setError(errorMessage(e, 'Update failed'));
        } finally {
            setUpdating(false);
        }
    };

    return (
        <AppLayout title="Application">
            <Head title="Application" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/jobs/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← My applications
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading application...</p>
                    </div>
                ) : error || !application ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Application not found</h3>
                        <p className="mt-1 text-sm text-gray-500">{error ?? 'It does not exist or is not yours.'}</p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {application.job_post?.title ?? 'Application'}
                            </h1>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600">
                                {application.status}
                            </span>
                        </div>
                        {application.user && (
                            <p className="mt-1 text-sm text-gray-500">
                                {application.user.name} · {application.user.email}
                            </p>
                        )}
                        {application.cover_letter && (
                            <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{application.cover_letter}</p>
                        )}
                        <p className="mt-3 text-xs text-gray-400">Applied {formatDateTime(application.created_at)}</p>

                        {application.job_post && (
                            <div className="mt-6">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Move through pipeline</h2>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {NEXT.filter((s) => s !== application.status).map((status) => (
                                        <button key={status} onClick={() => setStatus(status)} disabled={updating}
                                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium capitalize hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600">
                                            {status}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-gray-400">Only the job owner can change the status.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
