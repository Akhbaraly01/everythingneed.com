import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { useEffect, useState } from 'react';
import {FileText, RefreshCcw} from 'lucide-react';

interface Need {
    id: string;
    request_number: string;
    title: string;
    status: string;
    created_at: string;
}

export default function NeedHistory() {
    const [needs, setNeeds] = useState<Need[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: Need[] }>('/api/need-requests')
            .then((res) => setNeeds(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load needs'));
                setNeeds([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    return (
        <AppLayout title="Need History">
            <Head title="Need History" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Need Requests</h1>
                {loading ? <p className="text-gray-500">Loading...</p> : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <Button onClick={load} variant="ghost" size="sm" className="mt-4 gap-2" iconLeft={<RefreshCcw className="h-4 w-4" />}>
                            Retry
                        </Button>
                    </div>
                ) : needs.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No requests yet</p>
                        <Link href="/needs/request" className="mt-4 inline-block text-blue-600 hover:underline">Create a Request</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {needs.map((n) => (
                            <Link key={n.id} href={`/needs/requests/${n.id}`} className="block rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800">
                                <div className="flex justify-between"><span className="font-semibold dark:text-white">{n.title}</span><span className={`text-xs px-2 py-1 rounded-full ${n.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{n.status}</span></div>
                                <p className="text-xs text-gray-400 mt-1">#{n.request_number} • {new Date(n.created_at).toLocaleDateString()}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
