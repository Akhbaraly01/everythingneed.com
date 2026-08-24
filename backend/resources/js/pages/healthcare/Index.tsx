import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Doctor, HealthTicket } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Stethoscope, Calendar, Clock, Star } from 'lucide-react';
import { useState } from 'react';

interface HealthcareProps {
    doctors: {
        data: Doctor[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    appointments: {
        data: HealthTicket[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

export default function Healthcare({ doctors, appointments }: HealthcareProps) {
    const [activeTab, setActiveTab] = useState<'doctors' | 'appointments'>('doctors');

    return (
        <AppLayout title="Healthcare">
            <Head title="Healthcare" />

            <div className="space-y-6">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex gap-6">
                        <button
                            onClick={() => setActiveTab('doctors')}
                            className={`border-b-2 pb-4 text-sm font-medium ${
                                activeTab === 'doctors'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            <Stethoscope className="mr-2 inline h-4 w-4" />
                            Doctors
                        </button>
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`border-b-2 pb-4 text-sm font-medium ${
                                activeTab === 'appointments'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            <Calendar className="mr-2 inline h-4 w-4" />
                            My Appointments
                        </button>
                    </nav>
                </div>

                {activeTab === 'doctors' && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {doctors.data.map((doctor) => (
                            <div key={doctor.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 flex-shrink-0 rounded-full bg-gray-200">
                                        {doctor.avatar_url && (
                                            <img src={doctor.avatar_url} alt={doctor.full_name} className="h-16 w-16 rounded-full object-cover" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{doctor.full_name}</h3>
                                        <p className="text-sm text-indigo-600">{doctor.specialization}</p>
                                        <p className="text-xs text-gray-500">{doctor.qualification}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        {doctor.rating ?? 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {doctor.experience_years} yrs exp
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(doctor.consultation_fee)}
                                    </span>
                                    <Link
                                        href={`/healthcare/book?doctor=${doctor.id}`}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                                    >
                                        Book Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="space-y-4">
                        {appointments.data.length === 0 ? (
                            <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No appointments</h3>
                                <p className="mt-2 text-gray-500">Book a doctor to get started.</p>
                            </div>
                        ) : (
                            appointments.data.map((ticket) => (
                                <div key={ticket.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {ticket.ticket_number}
                                            </h3>
                                            <p className="text-sm text-gray-500">{formatDateTime(ticket.created_at)}</p>
                                        </div>
                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{ticket.symptoms}</p>
                                    {ticket.doctor && (
                                        <p className="mt-1 text-sm text-indigo-600">Dr. {ticket.doctor.full_name}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
