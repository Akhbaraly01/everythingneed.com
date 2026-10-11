import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import {User, Star, Clock, Briefcase} from 'lucide-react';

interface Worker {
    id: string;
    full_name: string;
    worker_type: string;
    bio: string;
    avatar_url: string;
    hourly_rate: number;
    experience_years: number;
    completed_jobs: number;
    rating: number;
    is_available: boolean;
}

export default function WorkerProfile({ worker_id }: { worker_id?: string }) {
    const [worker, setWorker] = useState<Worker | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (worker_id) {
            api.get<{ data: Worker }>(`/api/building-services/workers/${worker_id}`)
                .then((res) => setWorker(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [worker_id]);

    if (loading) return <AppLayout title="Worker Profile"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!worker) return <AppLayout title="Worker Profile"><p className="p-12 text-center text-red-500">Worker not found</p></AppLayout>;

    return (
        <AppLayout title={worker.full_name}>
            <Head title={worker.full_name} />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{worker.full_name}</h1>
                            <p className="text-gray-500 capitalize">{worker.worker_type}</p>
                            <div className="mt-2 flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-yellow-500"><Star className="h-4 w-4" /> {worker.rating || 'New'}</span>
                                <span className="flex items-center gap-1 text-gray-500"><Briefcase className="h-4 w-4" /> {worker.completed_jobs} jobs</span>
                                <span className="flex items-center gap-1 text-gray-500"><Clock className="h-4 w-4" /> {worker.experience_years}yr exp</span>
                            </div>
                        </div>
                    </div>
                    {worker.bio && <p className="mt-6 text-gray-600 dark:text-gray-400">{worker.bio}</p>}
                    <div className="mt-4 flex items-center gap-4">
                        <span className="text-lg font-bold text-green-600">${worker.hourly_rate}/hr</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${worker.is_available ? 'bg-green-100 text-green-800 dark:bg-green-900/30' : 'bg-red-100 text-red-800 dark:bg-red-900/30'}`}>
                            {worker.is_available ? 'Available' : 'Busy'}
                        </span>
                    </div>
                </div>
                <Link
                    href={`/building-services/book?worker=${worker.id}`}
                    className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-white hover:bg-blue-700"
                >
                    Book This Worker
                </Link>
            </div>
        </AppLayout>
    );
}
