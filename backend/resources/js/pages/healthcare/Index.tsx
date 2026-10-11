import { Head, Link } from '@inertiajs/react';
import MarketplaceLayout from '@/layouts/MarketplaceLayout';
import type { Doctor, HealthTicket } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import {Stethoscope, Calendar, CalendarCheck, Clock, Star, Play, FileText, FlaskConical, Video, HeartPulse, HeartHandshake, Search, Pill} from 'lucide-react';
import { useState } from 'react';
import Image from '@/components/shared/Image';

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

type Paginated<T> = { data: T[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };

function normalizeList<T>(input: Paginated<T> | T[] | null | undefined): T[] {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    return input.data ?? [];
}

export default function Healthcare({ doctors, appointments }: HealthcareProps) {
    const [activeTab, setActiveTab] = useState<'doctors' | 'appointments'>('doctors');
    const doctorList = normalizeList(doctors as unknown as Paginated<Doctor> | Doctor[]);
    const appointmentList = normalizeList(appointments as unknown as Paginated<HealthTicket> | HealthTicket[]);

    return (
        <MarketplaceLayout title="Healthcare">
            <Head title="Healthcare" />
            <div className="container mx-auto px-3 py-4 space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 p-6 text-white">
                    <h1 className="text-xl md:text-2xl font-bold">Healthcare at Your Doorstep</h1>
                    <p className="mt-1 text-sm text-white/80">Book appointments &amp; order medicines online</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link href="/healthcare/doctors" className="inline-flex h-9 items-center rounded-md bg-white px-4 text-xs font-semibold text-pink-700">
                            Find Doctors
                        </Link>
                        <Link href="/pharmacy" className="inline-flex h-9 items-center rounded-md bg-white/20 px-4 text-xs font-medium text-white hover:bg-white/30">
                            Order Medicines
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {[
                        { label: 'Labs', href: '/healthcare/labs', icon: FlaskConical },
                        { label: 'Virtual', href: '/healthcare/virtual', icon: Video },
                        { label: 'Videos', href: '/healthcare/videos', icon: Play },
                        { label: 'Documentation', href: '/healthcare/documents', icon: FileText },
                        { label: 'Healthcare Aid', href: '/healthcare/aid', icon: HeartHandshake },
                        { label: 'Providers', href: '/healthcare/providers', icon: Stethoscope },
                        { label: 'Services', href: '/healthcare/health-services', icon: HeartPulse },
                        { label: 'Search', href: '/healthcare/search', icon: Search },
                        { label: 'Prescriptions', href: '/healthcare/prescriptions', icon: Pill },
                        { label: 'Health Bookings', href: '/healthcare/bookings', icon: CalendarCheck },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm font-medium shadow-sm hover:shadow-md"
                        >
                            <item.icon className="h-4 w-4 text-primary" />
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="border-b border-border">
                    <nav className="-mb-px flex gap-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('doctors')}
                            className={`border-b-2 pb-4 text-sm font-medium ${
                                activeTab === 'doctors'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Stethoscope className="mr-2 inline h-4 w-4" />
                            Doctors
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('appointments')}
                            className={`border-b-2 pb-4 text-sm font-medium ${
                                activeTab === 'appointments'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Calendar className="mr-2 inline h-4 w-4" />
                            My Appointments
                        </button>
                    </nav>
                </div>

                {activeTab === 'doctors' && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {doctorList.length === 0 ? (
                            <div className="col-span-full rounded-xl border border-border bg-card p-12 text-center shadow-sm">
                                <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No doctors available</h3>
                                <p className="mt-2 text-sm text-muted-foreground">Please check back later.</p>
                            </div>
                        ) : (
                        doctorList.map((doctor) => (
                            <div key={doctor.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 flex-shrink-0 rounded-full bg-muted overflow-hidden">
                                        {doctor.avatar_url && (
                                            <Image src={doctor.avatar_url} alt={doctor.full_name} className="h-16 w-16 rounded-full object-cover" loading="lazy" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{doctor.full_name}</h3>
                                        <p className="text-sm text-primary">{doctor.specialization}</p>
                                        <p className="text-xs text-muted-foreground">{doctor.qualification}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        {doctor.rating ?? 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {doctor.experience_years} yrs exp
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-lg font-bold">
                                        {formatPrice(doctor.consultation_fee)}
                                    </span>
                                    <Link
                                        href={`/healthcare/doctors/${doctor.id}`}
                                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                                    >
                                        Book Now
                                    </Link>
                                </div>
                            </div>
                        ))
                        )}
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="space-y-4">
                        {appointmentList.length === 0 ? (
                            <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
                                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No appointments</h3>
                                <p className="mt-2 text-sm text-muted-foreground">Book a doctor to get started.</p>
                            </div>
                        ) : (
                            appointmentList.map((ticket) => (
                                <div key={ticket.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold">{ticket.ticket_number}</h3>
                                            <p className="text-sm text-muted-foreground">{formatDateTime(ticket.created_at)}</p>
                                        </div>
                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">{ticket.symptoms}</p>
                                    {ticket.doctor && (
                                        <p className="mt-1 text-sm text-primary">Dr. {ticket.doctor.full_name}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </MarketplaceLayout>
    );
}
