import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { useEffect, useState } from 'react';
import {CheckCircle, Calendar, Clock, MapPin, CreditCard} from 'lucide-react';

interface Appointment {
    id: string;
    ticket_number?: string;
    doctor?: { full_name?: string; specialization?: string; consultation_fee?: number } | null;
    appointment_date?: string;
    appointment_time?: string;
    consultation_type?: string;
    status?: string;
}

export default function BookingConfirmation() {
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (!id) {
            setLoading(false);
            return;
        }
        // Doctor/virtual bookings resolve as tickets; lab bookings resolve as
        // lab_bookings; generic appointments resolve as appointments - try all
        // three so confirmation never strands anyone.
        api.get<{ data: Appointment }>(`/api/health/tickets/${id}`)
            .then((res) => setAppointment(res.data))
            .catch(() => api.get<{ data: Appointment }>(`/api/health/labs/bookings/${id}`)
                .then((res) => setAppointment(res.data))
                .catch(() => api.get<{ data: Appointment }>(`/api/appointments/${id}`)
                    .then((res) => setAppointment(res.data))
                    .catch(() => {})))
            .finally(() => setLoading(false));
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
                        <p className="mt-1 text-sm text-gray-500">Ticket #{appointment.ticket_number ?? appointment.id.slice(0, 8)}</p>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Appointment Details</h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{appointment.appointment_date ?? 'Scheduled'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{appointment.appointment_time ?? 'See your appointments'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{appointment.consultation_type || 'In-Person'}</span>
                        </div>
                        {appointment.doctor?.consultation_fee != null && (
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">${appointment.doctor.consultation_fee}</span>
                            </div>
                        )}
                    </div>
                </div>

                {appointment.doctor && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Doctor</h2>
                        <p className="text-gray-700 dark:text-gray-300">{appointment.doctor.full_name}</p>
                        <p className="text-sm text-gray-500">{appointment.doctor.specialization}</p>
                    </div>
                )}

                <div className="flex gap-4">
                    <Button
                        onClick={() => router.visit('/healthcare/appointments')}
                        className="flex-1"
                    >
                        View My Appointments
                    </Button>
                    <Button
                        onClick={() => router.visit('/healthcare')}
                        variant="outline"
                        className="flex-1"
                    >
                        Back to Healthcare
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
