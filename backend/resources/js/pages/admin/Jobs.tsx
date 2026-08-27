import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Briefcase, MapPin, DollarSign } from 'lucide-react';

interface Job { id: string; title: string; company: string; location: string; job_type: string; salary_min: number; salary_max: number; is_active: boolean; created_at: string; }

export default function AdminJobs() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Job[] }>('/api/jobs')
            .then((res) => setJobs((res.data as any)?.data || res.data || []))
            .catch(() => setJobs([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Jobs Management">
            <Head title="Jobs Management" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Briefcase className="h-6 w-6" /> Jobs Management</h1>
                {loading ? <p className="text-gray-500">Loading...</p> : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr><th className="px-4 py-3">Job</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Salary</th><th className="px-4 py-3">Status</th></tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {jobs.map((j) => (
                                    <tr key={j.id}>
                                        <td className="px-4 py-3 font-medium dark:text-white">{j.title}</td>
                                        <td className="px-4 py-3">{j.company}</td>
                                        <td className="px-4 py-3 text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</td>
                                        <td className="px-4 py-3">${j.salary_min} - ${j.salary_max}</td>
                                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${j.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{j.is_active ? 'Active' : 'Inactive'}</span></td>
                                    </tr>
                                ))}
                                {jobs.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No jobs</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
