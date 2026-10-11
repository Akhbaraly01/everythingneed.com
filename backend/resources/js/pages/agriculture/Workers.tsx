import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import {Users, Star, Briefcase} from 'lucide-react';

interface Worker {
    id: string;
    full_name: string;
    worker_type: string;
    rating: number;
    completed_jobs: number;
    is_available: boolean;
    hourly_rate: number;
}

export default function AgricultureWorkers() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Worker[] }>('/api/building-services/workers', { params: { type: 'agriculture' } })
            .then((res) => setWorkers(res.data))
            .catch(() => setWorkers([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Agriculture Workers">
            <Head title="Agriculture Workers" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users className="h-6 w-6 text-green-600" /> Agriculture Workers</h1>
                {loading ? <p className="text-gray-500">Loading...</p> : workers.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No agriculture workers available</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {workers.map((w) => (
                            <div key={w.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <p className="font-semibold dark:text-white">{w.full_name}</p>
                                <p className="text-sm text-gray-500 capitalize">{w.worker_type}</p>
                                <div className="mt-2 flex gap-3 text-sm">
                                    <span className="flex items-center gap-1 text-yellow-500"><Star className="h-3 w-3" />{w.rating || 'New'}</span>
                                    <span className="flex items-center gap-1 text-gray-500"><Briefcase className="h-3 w-3" />{w.completed_jobs} jobs</span>
                                </div>
                                <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${w.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{w.is_available ? 'Available' : 'Busy'}</span>
                                <Link
                                    href={`/building-services/workers/${w.id}`}
                                    className="mt-3 block rounded-lg bg-indigo-600 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-indigo-500"
                                >
                                    View & Hire
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
