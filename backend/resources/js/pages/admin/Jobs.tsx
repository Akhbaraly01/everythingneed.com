import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import { useCallback, useEffect, useState } from 'react';
import { Briefcase, MapPin, Pencil, Power, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/lib/confirm';
import { formatDateTime } from '@/lib/utils';

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
    description?: string;
}

interface Application {
    id: string;
    status: string;
    resume_url?: string | null;
    created_at: string;
    user?: { id: string; name: string; email: string } | null;
    job_post?: { id: string; title: string; company: string } | null;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary'] as const;

const typeLabel = (t: string) => t.replace(/_/g, ' ');

export default function AdminJobs() {
    const confirm = useConfirm();
    const [view, setView] = useState<'posts' | 'applications'>('posts');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);

    // Applications queue (read-only triage view).
    const [applications, setApplications] = useState<Application[]>([]);
    const [appsMeta, setAppsMeta] = useState<Meta | null>(null);
    const [appsLoading, setAppsLoading] = useState(false);
    const [appsPage, setAppsPage] = useState(1);

    // Edit dialog.
    const [editJob, setEditJob] = useState<Job | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '', company: '', location: '', job_type: 'full_time',
        salary_min: '', salary_max: '', description: '', expires_at: '', is_active: true,
    });

    useEffect(() => {
        if (view !== 'posts') return;
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
    }, [status, page, view]);

    const loadApplications = useCallback(() => {
        setAppsLoading(true);
        api.get<{ data: Application[]; meta: Meta }>(`/api/admin/job-applications?page=${appsPage}&per_page=25`)
            .then((res) => {
                setApplications(rows<Application>(res));
                setAppsMeta(res.meta);
            })
            .catch((e) => {
                setApplications([]);
                toast.error(errorMessage(e, 'Failed to load applications'));
            })
            .finally(() => setAppsLoading(false));
    }, [appsPage]);

    useEffect(() => {
        if (view === 'applications') loadApplications();
    }, [view, loadApplications]);

    const toggle = async (j: Job) => {
        try {
            await api.put(`/api/admin/jobs/${j.id}`, { is_active: !j.is_active });
            setJobs(jobs.map((x) => (x.id === j.id ? { ...x, is_active: !x.is_active } : x)));
            toast.success(`Job ${!j.is_active ? 'activated' : 'deactivated'}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        }
    };

    const openEdit = (j: Job) => {
        setEditJob(j);
        setEditForm({
            title: j.title,
            company: j.company,
            location: j.location,
            job_type: j.job_type,
            salary_min: j.salary_min ? String(j.salary_min) : '',
            salary_max: j.salary_max ? String(j.salary_max) : '',
            description: j.description ?? '',
            expires_at: j.expires_at ? j.expires_at.slice(0, 10) : '',
            is_active: j.is_active,
        });
    };

    const saveEdit = async () => {
        if (!editJob) return;
        if (!editForm.title.trim() || !editForm.company.trim() || !editForm.location.trim()) {
            toast.error('Title, company and location are required.');
            return;
        }
        setEditSaving(true);
        try {
            await api.put(`/api/admin/jobs/${editJob.id}`, {
                title: editForm.title.trim(),
                company: editForm.company.trim(),
                location: editForm.location.trim(),
                job_type: editForm.job_type,
                salary_min: editForm.salary_min ? Number(editForm.salary_min) : null,
                salary_max: editForm.salary_max ? Number(editForm.salary_max) : null,
                description: editForm.description || null,
                expires_at: editForm.expires_at || null,
                is_active: editForm.is_active,
            });
            toast.success(`${editForm.title.trim()} updated.`);
            setEditJob(null);
            setLoading(true);
            api.get<{ data: Job[]; meta: Meta }>(`/api/admin/jobs?page=${page}&status=${status}&per_page=25`)
                .then((res) => { setJobs(rows<Job>(res)); setMeta(res.meta); })
                .finally(() => setLoading(false));
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to update job'));
        } finally {
            setEditSaving(false);
        }
    };

    const deleteJob = async (j: Job) => {
        const ok = await confirm({
            title: `Delete ${j.title}?`,
            description: 'The post is removed. Posts with applications cannot be deleted — deactivate instead.',
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        try {
            await api.del(`/api/admin/jobs/${j.id}`);
            toast.success(`${j.title} deleted.`);
            setJobs((prev) => prev.filter((x) => x.id !== j.id));
            setMeta((m) => (m ? { ...m, total: Math.max(0, m.total - 1) } : m));
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to delete job'));
        }
    };

    const isExpired = (j: Job) => !!j.expires_at && new Date(j.expires_at) < new Date();

    return (
        <AdminLayout title="Jobs Management">
            <Head title="Jobs Management" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Briefcase className="h-6 w-6" /> Jobs Management</h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-800">
                        <button onClick={() => setView('posts')} data-testid="jobs-tab-posts"
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${view === 'posts' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                            <Briefcase className="h-4 w-4" /> Posts
                        </button>
                        <button onClick={() => setView('applications')} data-testid="jobs-tab-applications"
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${view === 'applications' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                            <Users className="h-4 w-4" /> Applications
                        </button>
                    </div>
                    {view === 'posts' && meta && <span className="text-sm text-gray-500">{meta.total} posts</span>}
                    {view === 'applications' && appsMeta && <span className="text-sm text-gray-500">{appsMeta.total} applications</span>}
                </div>

                {view === 'posts' && (
                <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as const).map((s) => (
                        <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {s}
                        </button>
                    ))}
                </div>
                )}

                {view === 'posts' ? (
                <DataTable
                    columns={[
                        {
                            key: 'job', header: 'Job', accessor: 'title', sortable: true,
                            render: (j) => (
                                <>
                                    <p className="font-medium dark:text-white">{j.title}</p>
                                    <p className="text-xs uppercase text-gray-500">{typeLabel(j.job_type)}</p>
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
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggle(j)} title={j.is_active ? 'Deactivate' : 'Activate'}
                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                        <Power className="h-3 w-3" /> {j.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                    <button onClick={() => openEdit(j)} title="Edit job" data-testid={`job-edit-${j.id}`}
                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-gray-600">
                                        <Pencil className="h-3 w-3" /> Edit
                                    </button>
                                    <button onClick={() => void deleteJob(j)} title="Delete job" data-testid={`job-delete-${j.id}`}
                                        className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800">
                                        <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    data={jobs}
                    loading={loading}
                    emptyTitle="No jobs"
                />
                ) : (
                <DataTable
                    columns={[
                        {
                            key: 'applicant', header: 'Applicant',
                            render: (a: Application) => (
                                <>
                                    <p className="font-medium dark:text-white">{a.user?.name ?? '—'}</p>
                                    <p className="text-xs text-gray-500">{a.user?.email ?? ''}</p>
                                </>
                            ),
                        },
                        {
                            key: 'job', header: 'Job',
                            render: (a: Application) => (
                                <>
                                    <p className="dark:text-white">{a.job_post?.title ?? '—'}</p>
                                    <p className="text-xs text-gray-500">{a.job_post?.company ?? ''}</p>
                                </>
                            ),
                        },
                        {
                            key: 'status', header: 'Status',
                            render: (a: Application) => (
                                <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                                    a.status === 'hired' ? 'bg-green-100 text-green-800'
                                    : a.status === 'rejected' ? 'bg-red-100 text-red-800'
                                    : a.status === 'shortlisted' ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>{a.status}</span>
                            ),
                        },
                        {
                            key: 'resume', header: 'Resume',
                            render: (a: Application) =>
                                a.resume_url ? (
                                    <a href={a.resume_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:underline">View</a>
                                ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                ),
                        },
                        {
                            key: 'applied', header: 'Applied',
                            render: (a: Application) => <span className="text-xs text-gray-500">{formatDateTime(a.created_at)}</span>,
                        },
                    ]}
                    data={applications}
                    loading={appsLoading}
                    emptyTitle="No applications yet"
                    emptyDescription="Applications land here as soon as candidates apply."
                />
                )}

                {view === 'posts' && meta && meta.last_page > 1 && (
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

                {view === 'applications' && appsMeta && appsMeta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {appsMeta.current_page} of {appsMeta.last_page}</span>
                        <div className="flex gap-2">
                            <button disabled={appsMeta.current_page <= 1} onClick={() => setAppsPage(appsPage - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={appsMeta.current_page >= appsMeta.last_page} onClick={() => setAppsPage(appsPage + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}

                {editJob && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" data-testid="job-edit-modal">
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Edit job post</h2>
                                    <p className="text-xs text-gray-500">{editJob.company}</p>
                                </div>
                                <button onClick={() => setEditJob(null)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Title
                                    <input data-testid="job-edit-title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Company
                                    <input data-testid="job-edit-company" value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Location
                                    <input data-testid="job-edit-location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Job type
                                    <select data-testid="job-edit-type" value={editForm.job_type} onChange={(e) => setEditForm({ ...editForm, job_type: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm capitalize dark:border-gray-600 dark:bg-gray-700">
                                        {JOB_TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
                                    </select>
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Expires
                                    <input data-testid="job-edit-expires" type="date" value={editForm.expires_at} onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Salary min
                                    <input data-testid="job-edit-salary-min" type="number" min="0" value={editForm.salary_min} onChange={(e) => setEditForm({ ...editForm, salary_min: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300">Salary max
                                    <input data-testid="job-edit-salary-max" type="number" min="0" value={editForm.salary_max} onChange={(e) => setEditForm({ ...editForm, salary_max: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">Description
                                    <textarea data-testid="job-edit-description" rows={4} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">
                                    <input data-testid="job-edit-active" type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                                    Active (visible in listings and search)
                                </label>
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button onClick={() => setEditJob(null)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                    Cancel
                                </button>
                                <button onClick={() => void saveEdit()} disabled={editSaving} data-testid="job-edit-save"
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                                    {editSaving ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
