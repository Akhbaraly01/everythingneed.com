import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { Stethoscope, Beaker, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LabTest {
    id: string;
    name: string;
    description?: string;
    price: number;
    turnaround_time?: string;
    category?: string;
}

export default function HealthcareLabs() {
    const [labs, setLabs] = useState<LabTest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: LabTest[] }>('/api/healthcare/labs')
            .then((res) => setLabs(res.data))
            .catch(() => setLabs([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Lab Tests">
            <Head title="Lab Tests" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lab Tests & Diagnostics</h1>
                <p className="text-sm text-gray-500">Browse and book lab tests</p>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : labs.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Beaker className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No lab tests available</h3>
                        <Link href="/healthcare" className="mt-4 inline-flex text-sm text-indigo-600 hover:underline">Back to Healthcare</Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {labs.map((lab) => (
                            <div key={lab.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{lab.name}</h3>
                                {lab.category && <p className="text-xs text-indigo-600">{lab.category}</p>}
                                {lab.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{lab.description}</p>}
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="font-bold text-gray-900 dark:text-white">${lab.price}</span>
                                    {lab.turnaround_time && <span className="text-xs text-gray-500">{lab.turnaround_time}</span>}
                                </div>
                                <button className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                                    Book Test
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
