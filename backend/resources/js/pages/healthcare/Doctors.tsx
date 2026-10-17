import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import {User, Star, RefreshCcw} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from '@/components/shared/Image';

interface Doctor {
    id: string;
    name: string;
    specialty: string;
    profession?: string;
    bio?: string;
    image_url?: string;
    rating?: number;
    consultation_fee?: number;
    years_experience?: number;
}

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [professionFilter, setProfessionFilter] = useState('');
    const [retryTick, setRetryTick] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (specialtyFilter) params.set('specialization', specialtyFilter);
        if (professionFilter) params.set('profession', professionFilter);
        const query = params.toString() ? `?${params.toString()}` : '';
        api.get<{ data: Doctor[] }>(`/api/doctors${query}`)
            .then((res) => setDoctors(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load doctors'));
                setDoctors([]);
            })
            .finally(() => setLoading(false));
    }, [specialtyFilter, professionFilter, retryTick]);

    const specialties = ['General Practice', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Psychiatry'];
    const professions = ['doctor', 'nurse', 'chew', 'dentist', 'pharmacist', 'medical_laboratory_scientist', 'physiotherapist', 'optometrist', 'midwife', 'dietitian', 'psychologist', 'other'];

    return (
        <AppLayout title="Find a Doctor">
            <Head title="Find a Doctor" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find a Doctor</h1>
                    <p className="text-sm text-gray-500">Book consultations with verified healthcare professionals</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setSpecialtyFilter('')} variant={!specialtyFilter ? 'primary' : 'outline'} size="sm" className="rounded-full px-4 py-1.5">All Specialties</Button>
                    {specialties.map((s) => (
                        <Button key={s} onClick={() => setSpecialtyFilter(s)} variant={specialtyFilter === s ? 'primary' : 'outline'} size="sm" className="rounded-full px-4 py-1.5">{s}</Button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setProfessionFilter('')} variant={!professionFilter ? 'primary' : 'outline'} size="sm" className="rounded-full px-4 py-1.5">All Professions</Button>
                    {professions.map((p) => (
                        <Button key={p} onClick={() => setProfessionFilter(p)} variant={professionFilter === p ? 'primary' : 'outline'} size="sm" className="rounded-full px-4 py-1.5">{p.charAt(0).toUpperCase() + p.slice(1).replace('_', ' ')}</Button>
                    ))}
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <Button onClick={() => setRetryTick((t) => t + 1)} variant="ghost" size="sm" className="mt-4 gap-2" iconLeft={<RefreshCcw className="h-4 w-4" />}>
                            Retry
                        </Button>
                    </div>
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
                                            <Image src={doc.image_url} alt="" className="h-full w-full object-cover" />
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
