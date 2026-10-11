import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Beaker, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState, { ErrorState } from '@/components/shared/LoadingState';

interface LabTest {
    id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    preparation_instructions?: string | null;
    result_time_hours?: number | null;
}

export default function HealthcareLabs() {
    const [labs, setLabs] = useState<LabTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError(null);
        api.get<{ data: LabTest[] }>('/api/health/labs')
            .then((res) => setLabs(res.data ?? []))
            .catch((e) => {
                setLabs([]);
                setError(errorMessage(e, 'Failed to load lab tests'));
            })
            .finally(() => setLoading(false));
    }, [attempt]);

    return (
        <AppLayout title="Lab Tests">
            <Head title="Lab Tests" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lab Tests & Diagnostics</h1>
                <p className="text-sm text-gray-500">Browse and book lab tests</p>
                <div className="flex flex-wrap gap-2 text-sm">
                    <Link href="/healthcare" className="font-medium text-indigo-600 hover:underline">← Back to Healthcare</Link>
                    <Link href="/healthcare/bookings" className="font-medium text-indigo-600 hover:underline">Health Bookings</Link>
                    <Link href="/healthcare/labs/bookings" className="font-medium text-indigo-600 hover:underline">My Lab Bookings</Link>
                    <Link href="/healthcare/aid" className="font-medium text-indigo-600 hover:underline">Healthcare Aid</Link>
                </div>

                {loading ? (
                    <LoadingState message="Loading lab tests..." />
                ) : error ? (
                    <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
                ) : labs.length === 0 ? (
                    <EmptyState
                        icon={<Beaker className="h-10 w-10" />}
                        title="No lab tests available"
                    >
                        <Link href="/healthcare" className="mt-2 inline-flex text-sm text-indigo-600 hover:underline">Back to Healthcare</Link>
                    </EmptyState>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {labs.map((lab) => (
                            <div key={lab.id} className="flex flex-col rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{lab.name}</h3>
                                {lab.category && <p className="text-xs text-indigo-600">{lab.category}</p>}
                                {lab.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{lab.description}</p>}
                                {lab.preparation_instructions && (
                                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                                        Prep: {lab.preparation_instructions}
                                    </p>
                                )}
                                <div className="mt-auto pt-3 flex items-center justify-between">
                                    <span className="font-bold text-gray-900 dark:text-white">${lab.price}</span>
                                    {lab.result_time_hours != null && (
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />{lab.result_time_hours}h
                                        </span>
                                    )}
                                </div>
                                <Link
                                    href={`/healthcare/labs/${lab.id}/book`}
                                    className="mt-3 block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
                                >
                                    Book Test
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
