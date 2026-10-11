import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

interface ProviderDetailProps {
    provider_id: string;
}

interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
    qualification?: string | null;
    consultation_fee?: number | null;
}

interface Lab {
    id: string;
    name: string;
    description?: string | null;
    price?: number | null;
}

export default function ProviderDetail({ provider_id }: ProviderDetailProps) {
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [lab, setLab] = useState<Lab | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            api.get<{ data: Doctor }>(`/api/doctors/${provider_id}`),
            api.get<{ data: Lab }>(`/api/health/labs/${provider_id}`),
        ]).then(([doc, labRes]) => {
            if (doc.status === 'fulfilled') setDoctor(doc.value.data);
            if (labRes.status === 'fulfilled') setLab(labRes.value.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [provider_id]);

    return (
        <AppLayout title="Provider">
            <Head title="Provider" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/healthcare/providers" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← All providers
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading provider...</p>
                    </div>
                ) : !doctor && !lab ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Provider not found</h3>
                        <p className="mt-1 text-sm text-gray-500">No doctor or lab matches this identifier.</p>
                    </div>
                ) : (
                    <>
                        {doctor && (
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Doctor</p>
                                <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{doctor.full_name}</h1>
                                <p className="text-sm text-gray-500">{doctor.specialization}{doctor.qualification ? ` · ${doctor.qualification}` : ''}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Link href={`/healthcare/doctors/${doctor.id}`}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                                        View profile
                                    </Link>
                                    <Link href={`/healthcare/doctors/${doctor.id}/book`}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600">
                                        Book appointment
                                    </Link>
                                </div>
                            </div>
                        )}
                        {lab && (
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Laboratory</p>
                                <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{lab.name}</h1>
                                {lab.description && <p className="mt-1 text-sm text-gray-500">{lab.description}</p>}
                                {lab.price !== null && lab.price !== undefined && (
                                    <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{formatPrice(lab.price)}</p>
                                )}
                                <Link href={`/healthcare/labs/${lab.id}`}
                                    className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                                    View test
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
