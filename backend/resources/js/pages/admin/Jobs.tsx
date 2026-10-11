import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import { useEffect, useState } from 'react';
import { Briefcase, MapPin, Power } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    job_type: string;
    salary_min: number;
    salary_max: number;
    is_active: boolean;
    expires_at?: string | null;
    created_at: string;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

export default function AdminJobs() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        api.get<{ data: Job[]; meta: Meta }>(`/api/admin/jobs?page=${page}&status=${status}&per_page=25`)
            .then((res) => {
                setJobs(rows<Job>(res));
                setMeta(res.meta);
            })
            .catch((e) => {
                setJobs([]);
                toast.error(errorMessage(e, 'Failed to load jobs'));
            })
            .finally(() => setLoading(false));
    }, [status, page]);

    const toggle = async (j: Job) => {
        try {
            await api.put(`/api/admin/jobs/${j.id}`, { is_active: !j.is_active });
            setJobs(jobs.map((x) => (x.id === j.id ? { ...x, is_active: !x.is_active } : x)));
            toast.success(`Job ${!j.is_active ? 'activated' : 'deactivated'}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        }
    };

    const isExpired = (j: Job) => !!j.expires_at && new Date(j.expires_at) < new Date();

    return (
        <AdminLayout title="Jobs Management">
            <Head title="Jobs Management" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Briefcase className="h-6 w-6" /> Jobs Management</h1>
                    {meta && <span className="text-sm text-gray-500">{meta.total} posts</span>}
                </div>

                <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as const).map((s) => (
                        <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {s}
                        </button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'job', header: 'Job', accessor: 'title', sortable: true,
                            render: (j) => (
                                <>
                                    <p className="font-medium dark:text-white">{j.title}</p>
                                    <p className="text-xs uppercase text-gray-500">{j.job_type}</p>
                                </>
                            ),
                        },
                        { key: 'company', header: 'Company', accessor: 'company', sortable: true },
                        {
                            key: 'location', header: 'Location', accessor: 'location', sortable: true,
                            render: (j) => (
                                <span className="text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>
                            ),
                        },
                        {
                            key: 'salary', header: 'Salary', accessor: 'salary_min', sortable: true,
                            render: (j) => <>${j.salary_min} - ${j.salary_max}</>,
                        },
                        {
                            key: 'status', header: 'Status',
                            render: (j) => (
                                <span className={`rounded-full px-2 py-1 text-xs ${j.is_active && !isExpired(j) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {!j.is_active ? 'Inactive' : isExpired(j) ? 'Expired' : 'Active'}
                                </span>
                            ),
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (j) => (
                                <button onClick={() => toggle(j)} title={j.is_active ? 'Deactivate' : 'Activate'}
                                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                    <Power className="h-3 w-3" /> {j.is_active ? 'Disable' : 'Enable'}
                                </button>
                            ),
                        },
                    ]}
                    data={jobs}
                    loading={loading}
                    emptyTitle="No jobs"
                />

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.current_page} of {meta.last_page}</span>
                        <div className="flex gap-2">
                            <button disabled={meta.current_page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
