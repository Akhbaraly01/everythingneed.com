import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import {ArrowLeft} from 'lucide-react';
import {useState} from 'react';
import Image from '@/components/shared/Image';
import PaySheet from '@/components/shared/PaySheet';

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

interface TimeSlot {
    time: string;
    available: boolean;
}

interface DoctorBookingProps {
    doctor: Doctor;
    availability: Record<string, TimeSlot[]>;
}

export default function DoctorBooking({ doctor, availability }: DoctorBookingProps) {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Spec 97 workflow: Book -> Pay -> Appointment. After booking, the page
    // switches to a payment step instead of jumping straight to the list.
    const [booked, setBooked] = useState<{ id: string } | null>(null);

    const dates = Object.keys(availability).sort();
    const slots = selectedDate ? (availability[selectedDate] ?? []) : [];

    const handleBook = async () => {
        if (!selectedDate || !selectedTime) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/appointments', {
                doctor_id: doctor.id,
                appointment_date: selectedDate,
                appointment_time: selectedTime,
                // API contract: `symptoms` is the required free-text reason;
                // consultation_type must be in_person | virtual.
                symptoms: reason.trim() || 'Consultation request',
                description: reason.trim() || undefined,
                consultation_type: 'in_person',
            });
            setBooked(res.data);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to book'));
        }
        setSubmitting(false);
    };

    return (
        <AppLayout>
            <Head title={`Book ${doctor.name}`} />
            <div className="max-w-3xl space-y-6">
                <Link href="/healthcare/doctors" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to doctors
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
                            {doctor.image_url ? <Image src={doctor.image_url} alt="" className="h-full w-full object-cover" /> : null}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{doctor.name}</h1>
                            <p className="text-indigo-600">{doctor.specialty}</p>
                            {doctor.years_experience && <p className="text-sm text-gray-500">{doctor.years_experience} years experience</p>}
                        </div>
                    </div>

                    {doctor.bio && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{doctor.bio}</p>}

                    {doctor.consultation_fee != null && (
                        <p className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Consultation fee: {formatPrice(doctor.consultation_fee)}</p>
                    )}
                </div>

                {booked ? (
                    <>
                        <PaySheet
                            endpoint={`/api/appointments/${booked.id}/pay`}
                            amount={doctor.consultation_fee ?? null}
                            title="Pay consultation fee"
                            onPaid={() => router.visit('/healthcare/appointments')}
                        />
                        <button
                            onClick={() => router.visit('/healthcare/appointments')}
                            className="w-full rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Pay later - manage from Appointments
                        </button>
                    </>
                ) : (
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Date & Time</h2>

                    <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason for visit</label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Optional..."
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                    </div>

                    <div className="mt-4 grid grid-cols-7 gap-2">
                        {dates.map((d) => (
                            <button key={d} onClick={() => { setSelectedDate(d); setSelectedTime(''); }}
                                className={`rounded-lg p-2 text-center text-xs font-medium ${
                                    selectedDate === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700'
                                }`}>
                                {new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </button>
                        ))}
                    </div>

                    {selectedDate && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {slots.filter((s) => s.available).map((slot) => (
                                <button key={slot.time} onClick={() => setSelectedTime(slot.time)}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                                        selectedTime === slot.time ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700'
                                    }`}>
                                    {slot.time}
                                </button>
                            ))}
                            {slots.filter((s) => s.available).length === 0 && (
                                <p className="col-span-4 text-sm text-gray-500">No available slots</p>
                            )}
                        </div>
                    )}

                    <button onClick={handleBook} disabled={submitting || !selectedDate || !selectedTime}
                        className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {submitting ? 'Booking...' : 'Book Appointment'}
                    </button>
                </div>
                )}
            </div>
        </AppLayout>
    );
}
