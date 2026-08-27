import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { User, Star, ArrowLeft, Clock, Calendar } from 'lucide-react';
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
    years_experience?: number;
}

interface ExpertProfileProps {
    expert_id: string;
}

export default function ExpertProfile({ expert_id }: ExpertProfileProps) {
    const [expert, setExpert] = useState<Expert | null>(null);
    const [loading, setLoading] = useState(true);
    const [availability, setAvailability] = useState<Record<string, string[]>>({});

    useEffect(() => {
        api.get<Expert>(`/api/experts/${expert_id}`)
            .then((res) => setExpert(res.data))
            .catch(() => setExpert(null))
            .finally(() => setLoading(false));
        api.get<Record<string, string[]>>(`/api/experts/${expert_id}/availability`)
            .then((res) => setAvailability(res.data))
            .catch(() => {});
    }, [expert_id]);

    if (loading) return <AppLayout title="Expert Profile"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!expert) return <AppLayout title="Expert Profile"><p className="p-12 text-center text-red-500">Not found</p></AppLayout>;

    return (
        <AppLayout title={expert.name}>
            <Head title={expert.name} />
            <div className="max-w-3xl mx-auto space-y-6">
                <Link href="/experts" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to Experts
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100">
                            {expert.image_url ? <img src={expert.image_url} alt="" className="h-full w-full rounded-full object-cover" /> :
                                <div className="flex h-full items-center justify-center text-gray-400"><User className="h-12 w-12" /></div>}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{expert.name}</h1>
                            <p className="text-indigo-600 font-medium">{expert.specialty}</p>
                            {expert.years_experience && <p className="text-sm text-gray-500">{expert.years_experience} years experience</p>}
                            {expert.rating && <p className="flex items-center gap-1 text-sm text-yellow-600"><Star className="h-4 w-4 fill-yellow-400" /> {expert.rating} rating</p>}
                        </div>
                    </div>
                    {expert.bio && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{expert.bio}</p>}
                    {expert.hourly_rate != null && <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">${expert.hourly_rate}/hour</p>}
                    <button className="mt-4 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                        Book Consultation
                    </button>
                </div>

                {Object.keys(availability).length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Clock className="h-5 w-5" /> Availability</h2>
                        <div className="mt-4 grid grid-cols-7 gap-2">
                            {Object.entries(availability).slice(0, 14).map(([date, slots]) => (
                                <div key={date}>
                                    <p className="text-[10px] text-center text-gray-500 mb-1">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                    <div className="space-y-1">
                                        {slots.slice(0, 3).map((s) => (
                                            <p key={s} className="text-[10px] bg-green-50 text-green-700 text-center rounded py-0.5 dark:bg-green-900/20 dark:text-green-400">{s}</p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
