import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { Stethoscope, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from '@/components/shared/Image';

interface Doctor {
    id: string;
    name: string;
    specialty: string;
    rating?: number;
    image_url?: string;
}

interface SpecialtyProps {
    specialty: string;
}

export default function HealthcareSpecialty({ specialty }: SpecialtyProps) {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Doctor[] }>(`/api/doctors?specialization=${encodeURIComponent(specialty)}`)
            .then((res) => setDoctors(res.data))
            .catch(() => setDoctors([]))
            .finally(() => setLoading(false));
    }, [specialty]);

    return (
        <AppLayout title={specialty}>
            <Head title={specialty} />
            <div className="space-y-6">
                <Link href="/healthcare" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to Healthcare
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{specialty} Specialists</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : doctors.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Stethoscope className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No doctors found for this specialty.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {doctors.map((doc) => (
                            <Link key={doc.id} href={`/healthcare/doctors/${doc.id}/profile`}
                                className="group rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
                                        {doc.image_url && <Image src={doc.image_url} alt="" className="h-full w-full rounded-full object-cover" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">Dr. {doc.name}</p>
                                        <p className="text-xs text-indigo-600">{doc.specialty}</p>
                                    </div>
                                </div>
                                {doc.rating && <p className="mt-2 text-xs text-yellow-600">Rating: {doc.rating}</p>}
                                <span className="mt-2 inline-block text-sm text-indigo-600">Book &rarr;</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
