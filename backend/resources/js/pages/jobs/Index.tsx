import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { EmptyState } from '@/components/shared/Ui';
import type { JobPost } from '@/types';
import {Briefcase, MapPin, DollarSign} from 'lucide-react';

interface JobsProps {
    jobs: { data: JobPost[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };
}

export default function Jobs({ jobs }: JobsProps) {
    const list = jobs?.data ?? [];
    if (list.length === 0) {
        return (
            <AppLayout title="Jobs">
                <Head title="Jobs" />
                <EmptyState
                    icon={<Briefcase className="h-10 w-10 text-gray-300" />}
                    title="No jobs found"
                    description="New listings appear here as soon as employers post them."
                    action={
                        <Link href="/jobs/create" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            Post a job
                        </Link>
                    }
                />
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Jobs">
            <Head title="Jobs" />
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
                <div className="flex flex-wrap gap-2">
                    <Link href="/jobs/search" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Search
                    </Link>
                    <Link href="/jobs/profile" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Employer profile
                    </Link>
                    <Link href="/jobs/create" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                        Post a job
                    </Link>
                </div>
            </div>
            <div className="space-y-4">
                {list.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-lg bg-white p-6 shadow hover:shadow-md dark:bg-gray-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                                <p className="text-sm text-indigo-600">{job.company}</p>
                                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.job_type}</span>
                                    {job.salary_min && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{job.salary_min.toLocaleString()} - {job.salary_max?.toLocaleString()}</span>}
                                </div>
                            </div>
                            <span className="text-sm font-medium text-indigo-600">View &rarr;</span>
                        </div>
                    </Link>
                ))}
            </div>
        </AppLayout>
    );
}
