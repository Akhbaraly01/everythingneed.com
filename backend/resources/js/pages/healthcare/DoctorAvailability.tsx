import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';

interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
    is_available: boolean;
}

interface Slot {
    id: string;
    status_message?: string | null;
    created_at?: string;
}

interface AvailabilityProps {
    doctor_id: string;
}

export default function DoctorAvailability({ doctor_id }: AvailabilityProps) {
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            api.get<{ data: Doctor }>(`/api/doctors/${doctor_id}`),
            api.get<{ data: Slot[] }>(`/api/doctors/${doctor_id}/availability`),
        ])
            .then(([doc, avail]) => {
                setDoctor(doc.data);
                setSlots(Array.isArray(avail.data) ? avail.data : []);
            })
            .catch((e) => setError(errorMessage(e, 'Availability not found')))
            .finally(() => setLoading(false));
    }, [doctor_id]);

    return (
        <AppLayout title="Doctor Availability">
            <Head title="Doctor Availability" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href={`/healthcare/doctors/${doctor_id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← Back to {doctor?.full_name ?? 'doctor'}
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading availability...</p>
                    </div>
                ) : error || !doctor ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Doctor not found</h3>
                        <p className="mt-1 text-sm text-gray-500">{error ?? 'This doctor does not exist.'}</p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                            <CalendarDays className="h-5 w-5" /> Weekly availability
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {doctor.full_name} · {doctor.specialization} ·{' '}
                            {doctor.is_available ? 'Accepting bookings' : 'Not accepting bookings'}
                        </p>
                        {slots.length === 0 ? (
                            <p className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                                This doctor has not published weekly slots yet. Booking requests are still
                                accepted and validated against real bookings.
                            </p>
                        ) : (
                            <ul className="mt-4 divide-y dark:divide-gray-700">
                                {slots.map((slot) => (
                                    <li key={slot.id} className="py-3 text-sm text-gray-900 dark:text-white">
                                        {slot.status_message ?? 'Available'}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Link
                            href={`/healthcare/doctors/${doctor_id}/book`}
                            className="mt-6 inline-flex rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            Book Appointment
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
