import ProviderLayout from '@/layouts/ProviderLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Briefcase, ListChecks, Handshake, HardHat, ClipboardList, FileText, Package } from 'lucide-react';

interface ProviderCounts {
    task_applications: number;
    job_applications: number;
    my_requests: number;
    building_bookings: number;
}

interface ProviderOpportunities {
    open_tasks: number;
    open_jobs: number;
}

interface ApplicationRow {
    id: string;
    status: string;
    created_at: string;
    title?: string;
}

interface ProviderDashboardProps {
    counts: ProviderCounts;
    opportunities: ProviderOpportunities;
    recentTaskApplications: ApplicationRow[];
    recentJobApplications: ApplicationRow[];
}

const STAT_CARDS: Array<{ key: keyof ProviderCounts; label: string; href: string; icon: typeof Briefcase }> = [
    { key: 'task_applications', label: 'Task Applications', href: '/tasks/my-applications', icon: ListChecks },
    { key: 'job_applications', label: 'Job Applications', href: '/jobs/applications', icon: Briefcase },
    { key: 'my_requests', label: 'My Service Requests', href: '/needs/history', icon: Handshake },
    { key: 'building_bookings', label: 'Building Bookings', href: '/account/bookings', icon: HardHat },
];

function ApplicationList({ rows, emptyText }: { rows: ApplicationRow[]; emptyText: string }) {
    if (rows.length === 0) {
        return <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>;
    }
    return (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{row.title ?? 'Untitled'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(row.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        {row.status?.replace('_', ' ') ?? 'submitted'}
                    </span>
                </li>
            ))}
        </ul>
    );
}

/**
 * Provider/worker workspace: own application & request counters (real,
 * self-scoped rows) plus live open opportunities. Zero activity renders
 * as honest zeros with links to find work.
 */
export default function ProviderDashboard({
    counts,
    opportunities,
    recentTaskApplications,
    recentJobApplications,
}: ProviderDashboardProps) {
    const page = usePage();
    const userName = ((page.props.auth as { name?: string } | null)?.name) ?? 'there';

    const totalActivity =
        counts.task_applications + counts.job_applications + counts.my_requests + counts.building_bookings;

    return (
        <ProviderLayout title="Provider Workspace">
            <Head title="Provider Workspace" />

            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Welcome back, {userName}. Everything below is scoped to your own records.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STAT_CARDS.map((card) => (
                    <Link
                        key={card.key}
                        href={card.href}
                        className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow dark:bg-gray-800 dark:ring-gray-700"
                    >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700">
                            <card.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </span>
                        <span className="mt-3 block text-2xl font-semibold text-gray-900 dark:text-white">
                            {counts[card.key].toLocaleString()}
                        </span>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
                    </Link>
                ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                    href="/tasks"
                    className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow dark:bg-gray-800 dark:ring-gray-700"
                >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30">
                        <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </span>
                    <span>
                        <span className="block text-xl font-semibold text-gray-900 dark:text-white">
                            {opportunities.open_tasks.toLocaleString()}
                        </span>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">Open tasks available</span>
                    </span>
                </Link>
                <Link
                    href="/jobs"
                    className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow dark:bg-gray-800 dark:ring-gray-700"
                >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </span>
                    <span>
                        <span className="block text-xl font-semibold text-gray-900 dark:text-white">
                            {opportunities.open_jobs.toLocaleString()}
                        </span>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">Open jobs available</span>
                    </span>
                </Link>
            </div>

            {totalActivity === 0 && (
                <div className="mt-6 rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                    <Package className="mx-auto h-10 w-10 text-gray-400" />
                    <h3 className="mt-3 text-base font-medium text-gray-900 dark:text-white">No activity yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Browse open tasks and jobs to send your first applications — counts appear here as soon as you do.
                    </p>
                </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent task applications</h3>
                    </div>
                    <ApplicationList rows={recentTaskApplications} emptyText="No task applications yet." />
                </div>
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent job applications</h3>
                    </div>
                    <ApplicationList rows={recentJobApplications} emptyText="No job applications yet." />
                </div>
            </div>
        </ProviderLayout>
    );
}
