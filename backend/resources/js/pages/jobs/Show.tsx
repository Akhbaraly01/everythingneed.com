import AppLayout from '@/layouts/AppLayout';
import { toast } from 'sonner';
import {Head, router} from '@inertiajs/react';
import type { JobPost } from '@/types';
import { MapPin, Briefcase, DollarSign, Clock, Building2, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { usePage } from '@inertiajs/react';

interface JobShowProps {
    job: JobPost;
}

export default function JobShow({ job }: JobShowProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const isOwner = auth?.user?.id === job.user_id;

    const handleApply = () => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        router.post(`/api/jobs/${job.id}/apply`, {}, {
            preserveScroll: true,
            onSuccess: () => router.reload(),
            onError: (errors) => {
                const msg = Object.values(errors)[0];
                if (typeof msg === 'string') toast.error(msg);
            },
        });
    };

    return (
        <AppLayout>
            <Head title={job.title} />

            <div className="space-y-8">
                {/* Header */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
                            <div className="mt-2 flex items-center gap-2 text-lg text-indigo-600">
                                <Building2 className="h-5 w-5" />
                                {job.company}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
                                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{job.job_type}</span>
                                {job.salary_min && (
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="h-4 w-4" />
                                        {formatPrice(job.salary_min)} - {formatPrice(job.salary_max ?? job.salary_min)}
                                    </span>
                                )}
                                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Posted {new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        {!isOwner && (
                            <button
                                onClick={handleApply}
                                className="rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500"
                            >
                                Apply Now
                            </button>
                        )}
                        {isOwner && (
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">Your listing</span>
                        )}
                    </div>
                </div>

                {/* Description */}
                {job.description && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Job Description</h2>
                        <p className="mt-4 whitespace-pre-wrap text-gray-600 dark:text-gray-400">{job.description}</p>
                    </div>
                )}

                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Requirements</h2>
                        <ul className="mt-4 space-y-2">
                            {job.requirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Benefits</h2>
                        <ul className="mt-4 space-y-2">
                            {job.benefits.map((benefit, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {job.expires_at && (
                    <p className="text-sm text-gray-500">
                        Application deadline: {new Date(job.expires_at).toLocaleDateString()}
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
