import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { CheckCircle, Calendar, Clock, MapPin, CreditCard, ArrowRight } from 'lucide-react';

interface Appointment {
    id: string;
    ticket_number: string;
    doctor: { full_name: string; specialization: string; consultation_fee: number };
    appointment_date: string;
    appointment_time: string;
    consultation_type: string;
    status: string;
}

export default function BookingConfirmation() {
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            api.get<{ data: Appointment }>(`/api/health/tickets/${id}`)
                .then((res) => setAppointment(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    if (loading) return <AppLayout title="Booking Confirmation"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!appointment) return <AppLayout title="Booking Confirmation"><p className="p-12 text-center text-red-500">Appointment not found</p></AppLayout>;

    return (
        <AppLayout title="Booking Confirmed">
            <Head title="Booking Confirmed" />
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg bg-green-50 p-8 text-center shadow dark:bg-green-900/20">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Booking Confirmed!</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Your appointment has been successfully booked.
                    </p>
                    <p className="mt-1 text-sm text-gray-500">Ticket #{appointment.ticket_number}</p>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Appointment Details</h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{appointment.appointment_date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{appointment.appointment_time}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{appointment.consultation_type || 'In-Person'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">${appointment.doctor.consultation_fee}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Doctor</h2>
                    <p className="text-gray-700 dark:text-gray-300">{appointment.doctor.full_name}</p>
                    <p className="text-sm text-gray-500">{appointment.doctor.specialization}</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => router.visit('/healthcare/appointments')}
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center text-white hover:bg-blue-700"
                    >
                        View My Appointments
                    </button>
                    <button
                        onClick={() => router.visit('/healthcare')}
                        className="flex-1 rounded-lg border px-4 py-3 text-center text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Back to Healthcare
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
