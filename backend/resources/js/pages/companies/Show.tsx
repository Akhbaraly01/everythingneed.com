import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Building2, Globe, MapPin, Users, Briefcase, RefreshCcw } from 'lucide-react';

interface CompanyJob {
    id: string;
    title: string;
    location?: string | null;
    job_type?: string | null;
    salary_min?: string | number | null;
    salary_max?: string | number | null;
    currency?: string | null;
    created_at: string;
}

interface Company {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    website?: string | null;
    industry?: string | null;
    company_size?: string | null;
    location?: string | null;
    logo_path?: string | null;
    jobs?: CompanyJob[];
}

interface ShowProps {
    company_slug: string;
}

const jobType = (t?: string | null) => (t ?? '').replace(/_/g, ' ');

/** N-32 public company profile: /companies/{slug}. */
export default function CompanyShow({ company_slug }: ShowProps) {
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: Company }>(`/api/companies/${encodeURIComponent(company_slug)}`)
            .then((res) => setCompany(res.data))
            .catch((e) => setError(errorMessage(e, 'Company not found')))
            .finally(() => setLoading(false));
    };

    useEffect(load, [company_slug]);

    return (
        <AppLayout title={company?.name ?? 'Company'}>
            <Head title={company?.name ?? 'Company'} />
            <div className="mx-auto max-w-4xl space-y-6">
                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading…</p></div>
                ) : error || !company ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h1 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Company not found</h1>
                        <p className="mt-1 text-sm text-gray-500">{error ?? 'It may have been removed.'}</p>
                        <button onClick={load} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            <RefreshCcw className="h-4 w-4" /> Retry
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <div className="flex items-start gap-4">
                                {company.logo_path ? (
                                    <img src={company.logo_path} alt={`${company.name} logo`} className="h-16 w-16 rounded-lg object-cover" />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                        {company.industry && <span>{company.industry}</span>}
                                        {company.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {company.location}</span>}
                                        {company.company_size && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {company.company_size}</span>}
                                        {company.website && (
                                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                                                <Globe className="h-3.5 w-3.5" /> Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {company.description && (
                                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">{company.description}</p>
                            )}
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                <Briefcase className="h-4 w-4" /> Open positions
                            </h2>
                            {!company.jobs?.length ? (
                                <p className="mt-3 text-sm text-gray-500">No open jobs right now.</p>
                            ) : (
                                <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
                                    {company.jobs.map((job) => (
                                        <li key={job.id}>
                                            <Link href={`/jobs/${job.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{job.title}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {[job.location, jobType(job.job_type)].filter(Boolean).join(' · ')}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {job.salary_min != null && job.salary_max != null
                                                        ? `${job.currency ?? '$'}${Number(job.salary_min).toLocaleString()}–${Number(job.salary_max).toLocaleString()}`
                                                        : 'View →'}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
