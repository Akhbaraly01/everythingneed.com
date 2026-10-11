import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { HeartPulse, PhoneCall } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';

interface EmergencyNumber {
    label: string;
    number: string;
}

const SECTIONS = [
    { name: 'Find Doctors', href: '/healthcare/doctors', blurb: 'Browse doctors by specialty and book appointments.' },
    { name: 'My Appointments', href: '/healthcare/appointments', blurb: 'Upcoming visits, tickets and consultation records.' },
    { name: 'Health Bookings', href: '/healthcare/bookings', blurb: 'Appointments, labs, medicines, home visits and custom requests in one place.' },
    { name: 'Healthcare Aid', href: '/healthcare/aid', blurb: 'Community-funded assistance for medical needs.' },
    { name: 'Laboratory', href: '/healthcare/labs', blurb: 'Lab test panels, bookings and results follow-up.' },
    { name: 'Pharmacy', href: '/healthcare/pharmacy', blurb: 'Medicines, prescriptions and order tracking.' },
    { name: 'Health Providers', href: '/healthcare/providers', blurb: 'Directory of doctors, labs and pharmacies.' },
    { name: 'Documentation', href: '/healthcare/documents', blurb: 'User guides: videos, documents and prevention guides.' },
    { name: 'My Prescriptions', href: '/healthcare/prescriptions', blurb: 'Prescriptions issued from your consultations.' },
];

export default function HealthServices() {
    const [numbers, setNumbers] = useState<EmergencyNumber[]>([]);
    const [support, setSupport] = useState('');

    useEffect(() => {
        api.get<{ data: { numbers: EmergencyNumber[]; support: string } }>('/api/health/emergency')
            .then((res) => {
                setNumbers(res.data.numbers);
                setSupport(res.data.support);
            })
            .catch((e) => setSupport(errorMessage(e, '')));
    }, []);

    return (
        <AppLayout title="Health Services">
            <Head title="Health Services" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                    <HeartPulse className="h-6 w-6" /> Health Services
                </h1>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {SECTIONS.map((section) => (
                        <Link key={section.href} href={section.href}
                            className="rounded-lg bg-white p-5 shadow hover:shadow-md dark:bg-gray-800">
                            <p className="font-semibold text-gray-900 dark:text-white">{section.name}</p>
                            <p className="mt-1 text-sm text-gray-500">{section.blurb}</p>
                        </Link>
                    ))}
                </div>

                <div className="rounded-lg bg-red-50 p-6 shadow dark:bg-red-900/10">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-red-800 dark:text-red-300">
                        <PhoneCall className="h-5 w-5" /> Emergency & support
                    </h2>
                    {numbers.length === 0 ? (
                        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                            Emergency contacts are unavailable right now — call your local emergency number.
                        </p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {numbers.map((entry) => (
                                <li key={`${entry.label}-${entry.number}`} className="flex items-center justify-between text-sm">
                                    <span className="text-red-800 dark:text-red-300">{entry.label}</span>
                                    <a href={`tel:${entry.number.replace(/\s/g, '')}`} className="font-bold text-red-900 underline dark:text-red-200">
                                        {entry.number}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                    {support !== '' && <p className="mt-3 text-xs text-red-700 dark:text-red-300">{support}</p>}
                    <Link href="/tickets" className="mt-3 inline-block text-sm font-medium text-red-800 underline dark:text-red-300">
                        Open a support ticket
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
