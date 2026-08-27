import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { User, Star, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Expert {
    id: string;
    name: string;
    specialty: string;
    bio?: string;
    image_url?: string;
    rating?: number;
    hourly_rate?: number;
    city?: string;
}

export default function ExpertsIndex() {
    const [experts, setExperts] = useState<Expert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Expert[] }>('/api/experts')
            .then((res) => setExperts(res.data))
            .catch(() => setExperts([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Find Experts">
            <Head title="Find Experts" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find Experts</h1>
                <p className="text-sm text-gray-500">Connect with professionals and consultants</p>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : experts.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <User className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No experts found</h3>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {experts.map((e) => (
                            <Link key={e.id} href={`/experts/${e.id}`}
                                className="group rounded-lg bg-white p-6 shadow transition hover:shadow-lg dark:bg-gray-800">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
                                        {e.image_url ? <img src={e.image_url} alt="" className="h-full w-full rounded-full object-cover" /> :
                                            <div className="flex h-full items-center justify-center text-gray-400"><User className="h-8 w-8" /></div>}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{e.name}</p>
                                        <p className="text-sm text-indigo-600">{e.specialty}</p>
                                    </div>
                                </div>
                                {e.bio && <p className="mt-3 text-sm text-gray-500 line-clamp-2">{e.bio}</p>}
                                <div className="mt-3 flex items-center justify-between text-sm">
                                    {e.city && <span className="flex items-center gap-1 text-gray-400"><MapPin className="h-3 w-3" /> {e.city}</span>}
                                    {e.hourly_rate != null && <span className="font-semibold text-gray-900 dark:text-white">${e.hourly_rate}/hr</span>}
                                </div>
                                {e.rating && <p className="mt-1 flex items-center gap-1 text-xs text-yellow-600"><Star className="h-3 w-3 fill-yellow-400" /> {e.rating}</p>}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
