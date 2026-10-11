import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { FlaskConical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

interface LabTest {
    id: string;
    name: string;
    description?: string | null;
    price?: number | null;
    preparation_instructions?: string | null;
    result_time_hours?: number | null;
}

interface LabShowProps {
    test_id: string;
}

export default function LabShow({ test_id }: LabShowProps) {
    const [test, setTest] = useState<LabTest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: LabTest }>(`/api/health/labs/${test_id}`)
            .then((res) => setTest(res.data))
            .catch((e) => setError(errorMessage(e, 'Test not found')))
            .finally(() => setLoading(false));
    }, [test_id]);

    return (
        <AppLayout title="Lab Test">
            <Head title="Lab Test" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/healthcare/labs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← All lab tests
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading test...</p>
                    </div>
                ) : error || !test ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Test not found</h3>
                        <p className="mt-1 text-sm text-gray-500">{error ?? 'This lab test does not exist.'}</p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                            <FlaskConical className="h-5 w-5" /> {test.name}
                        </h1>
                        {test.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{test.description}</p>}
                        {test.price !== null && test.price !== undefined && (
                            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(test.price)}</p>
                        )}
                        <dl className="mt-6 space-y-3 text-sm">
                            <div className="flex justify-between gap-4 border-b border-gray-100 pb-3 dark:border-gray-700">
                                <dt className="shrink-0 text-gray-500">Preparation</dt>
                                <dd className="text-right font-medium text-gray-900 dark:text-white">
                                    {test.preparation_instructions ?? 'No special preparation provided by this lab.'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="shrink-0 text-gray-500">Results</dt>
                                <dd className="text-right font-medium text-gray-900 dark:text-white">
                                    {test.result_time_hours != null ? `Within ${test.result_time_hours} hours` : 'Result time not published.'}
                                </dd>
                            </div>
                        </dl>
                        <Link
                            href={`/healthcare/labs/${test.id}/book`}
                            className="mt-6 inline-flex rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            Book this test
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
