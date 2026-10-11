import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { api, errorMessage, rows } from '@/lib/api';

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    job_type: string;
}

export default function JobsSearch() {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = (e: FormEvent) => {
        e.preventDefault();
        if (query.trim() === '' && location.trim() === '') return;
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (location.trim()) params.set('location', location.trim());
        api.get<{ data: Job[] }>(`/api/jobs/search?${params}`)
            .then((res) => {
                setJobs(rows<Job>(res));
                setSearched(true);
            })
            .catch((e) => setError(errorMessage(e, 'Search failed')))
            .finally(() => setLoading(false));
    };

    return (
        <AppLayout title="Search Jobs">
            <Head title="Search Jobs" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Jobs</h1>

                <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, company, keyword..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 dark:border-gray-600 dark:bg-gray-700" />
                    </div>
                    <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
                        className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 sm:w-48" />
                    <button type="submit" disabled={loading}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {error && <p className="text-sm text-red-600">{error}</p>}

                {searched && jobs.length === 0 && !error && (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">No jobs match your search.</p>
                    </div>
                )}

                {jobs.length > 0 && (
                    <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                        {jobs.map((job) => (
                            <Link key={job.id} href={`/jobs/${job.id}`}
                                className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{job.title}</p>
                                <p className="text-xs text-gray-500">{job.company} · {job.location} · {job.job_type?.replace(/_/g, ' ')}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
