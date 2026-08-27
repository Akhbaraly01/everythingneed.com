import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { FileText, DollarSign, Calendar, MapPin, MessageSquare, CheckCircle } from 'lucide-react';

interface Need {
    id: string;
    request_number: string;
    title: string;
    description: string;
    budget_min: number;
    budget_max: number;
    location: string;
    deadline: string;
    status: string;
    attachments: string[];
    created_at: string;
    offers: { id: string; price: number; message: string; status: string; provider: { name: string } }[];
}

export default function NeedShow({ need_id }: { need_id?: string }) {
    const [need, setNeed] = useState<Need | null>(null);
    const [loading, setLoading] = useState(true);
    const id = need_id || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : undefined);

    useEffect(() => {
        if (id) {
            api.get<{ data: Need }>(`/api/need-requests/${id}`)
                .then((res) => setNeed(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else setLoading(false);
    }, [id]);

    if (loading) return <AppLayout title="Need Details"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!need) return <AppLayout title="Need Details"><p className="p-12 text-center text-red-500">Request not found</p></AppLayout>;

    return (
        <AppLayout title={need.title}>
            <Head title={need.title} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">#{need.request_number}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${need.status === 'completed' ? 'bg-green-100 text-green-800' : need.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{need.status}</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{need.title}</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{need.description}</p>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded bg-gray-50 p-3 dark:bg-gray-700"><span className="text-gray-500">Budget</span><p className="font-semibold dark:text-white">${need.budget_min} - ${need.budget_max}</p></div>
                        <div className="rounded bg-gray-50 p-3 dark:bg-gray-700"><span className="text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</span><p className="font-semibold dark:text-white">{need.location || 'Anywhere'}</p></div>
                        <div className="rounded bg-gray-50 p-3 dark:bg-gray-700"><span className="text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Deadline</span><p className="font-semibold dark:text-white">{need.deadline || 'Flexible'}</p></div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold dark:text-white mb-3 flex items-center gap-2"><DollarSign className="h-5 w-5" /> Offers ({need.offers?.length || 0})</h2>
                    {need.offers && need.offers.length > 0 ? (
                        <div className="space-y-3">
                            {need.offers.map((o) => (
                                <div key={o.id} className="rounded-lg border p-4 dark:border-gray-600">
                                    <div className="flex justify-between"><span className="font-semibold dark:text-white">{o.provider?.name || 'Provider'}</span><span className="font-bold text-green-600">${o.price}</span></div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{o.message}</p>
                                    <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${o.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-500">No offers yet. Providers will respond soon.</p>}
                </div>
            </div>
        </AppLayout>
    );
}
