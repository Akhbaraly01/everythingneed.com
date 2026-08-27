import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { User, Star, Clock, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Doctor {
    id: string;
    name: string;
    specialty: string;
    bio?: string;
    image_url?: string;
    rating?: number;
    consultation_fee?: number;
    years_experience?: number;
}

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [specialtyFilter, setSpecialtyFilter] = useState('');

    useEffect(() => {
        const params = specialtyFilter ? `?specialty=${encodeURIComponent(specialtyFilter)}` : '';
        api.get<{ data: Doctor[] }>(`/api/doctors${params}`)
            .then((res) => setDoctors(res.data))
            .catch(() => setDoctors([]))
            .finally(() => setLoading(false));
    }, [specialtyFilter]);

    const specialties = ['General Practice', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Psychiatry'];

    return (
        <AppLayout title="Find a Doctor">
            <Head title="Find a Doctor" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find a Doctor</h1>
                    <p className="text-sm text-gray-500">Book consultations with verified healthcare professionals</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSpecialtyFilter('')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                        !specialtyFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}>All</button>
                    {specialties.map((s) => (
                        <button key={s} onClick={() => setSpecialtyFilter(s)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                            specialtyFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}>{s}</button>
                    ))}
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : doctors.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <User className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No doctors found</h3>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {doctors.map((doc) => (
                            <Link key={doc.id} href={`/healthcare/doctors/${doc.id}`}
                                className="group rounded-lg bg-white p-6 shadow transition hover:shadow-lg dark:bg-gray-800">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
                                        {doc.image_url ? (
                                            <img src={doc.image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-400"><User className="h-8 w-8" /></div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{doc.name}</p>
                                        <p className="text-sm text-indigo-600">{doc.specialty}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                    {doc.years_experience && <span>{doc.years_experience} yrs exp</span>}
                                    {doc.rating && (
                                        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{doc.rating}</span>
                                    )}
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    {doc.consultation_fee != null && (
                                        <span className="font-semibold text-gray-900 dark:text-white">${doc.consultation_fee}</span>
                                    )}
                                    <span className="text-sm text-indigo-600 group-hover:underline">Book &rarr;</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
