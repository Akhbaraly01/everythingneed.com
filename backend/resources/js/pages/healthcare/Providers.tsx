import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Building2, FlaskConical, Pill, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';

interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
}

interface Lab {
    id: string;
    name: string;
    category?: string | null;
    price?: number | null;
    result_time_hours?: number | null;
}

export default function Providers() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            api.get<{ data: Doctor[] }>('/api/doctors?per_page=50'),
            api.get<{ data: Lab[] }>('/api/health/labs'),
        ])
            .then(([docs, labList]) => {
                setDoctors(Array.isArray(docs.data) ? docs.data : []);
                setLabs(Array.isArray(labList.data) ? labList.data : []);
            })
            .catch((e) => setError(errorMessage(e, 'Failed to load providers')))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Healthcare Providers">
            <Head title="Healthcare Providers" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                    <Building2 className="h-6 w-6" /> Healthcare Providers
                </h1>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading providers...</p>
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">{error}</p>
                    </div>
                ) : (
                    <>
                        <section>
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <Stethoscope className="h-5 w-5" /> Doctors ({doctors.length})
                            </h2>
                            {doctors.length === 0 ? (
                                <p className="mt-2 text-sm text-gray-500">No doctors listed yet.</p>
                            ) : (
                                <div className="mt-3 divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                                    {doctors.map((doctor) => (
                                        <Link key={doctor.id} href={`/healthcare/providers/${doctor.id}`}
                                            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{doctor.full_name}</p>
                                                <p className="text-xs text-gray-500">{doctor.specialization}</p>
                                            </div>
                                            <span className="text-sm font-medium text-indigo-600">View →</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section>
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <FlaskConical className="h-5 w-5" /> Laboratories ({labs.length})
                            </h2>
                            {labs.length === 0 ? (
                                <p className="mt-2 text-sm text-gray-500">No lab panels listed yet.</p>
                            ) : (
                                <div className="mt-3 divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                                    {labs.map((lab) => (
                                        <Link key={lab.id} href={`/healthcare/labs/${lab.id}`}
                                            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{lab.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {[lab.category, lab.result_time_hours != null ? `${lab.result_time_hours}h turnaround` : null]
                                                        .filter(Boolean).join(' · ')}
                                                </p>
                                            </div>
                                            <span className="text-sm font-medium text-indigo-600">
                                                {lab.price != null ? `$${Number(lab.price).toFixed(2)} · ` : ''}View →
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        <Link href="/healthcare/pharmacy"
                            className="flex items-center gap-3 rounded-lg bg-white p-5 shadow hover:shadow-md dark:bg-gray-800">
                            <Pill className="h-6 w-6 text-indigo-600" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Pharmacies</p>
                                <p className="text-sm text-gray-500">Browse the medicine catalog and order with prescriptions.</p>
                            </div>
                        </Link>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
