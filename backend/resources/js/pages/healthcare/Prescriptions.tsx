import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { formatDate } from '@/lib/utils';
import { Pill, CalendarClock, Stethoscope, FileText } from 'lucide-react';

interface PrescriptionItem {
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
}

interface PrescriptionView {
    id: string;
    ticket_number?: string;
    date?: string;
    follow_up_date?: string | null;
    diagnosis?: string;
    items: PrescriptionItem[];
    doctor?: { full_name: string; specialization?: string } | null;
}

interface Props {
    prescriptions: PrescriptionView[];
}

export default function HealthcarePrescriptions({ prescriptions }: Props) {
    return (
        <AppLayout title="My prescriptions">
            <Head title="My prescriptions" />
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100"><Pill className="h-6 w-6 text-teal-600" /></span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prescriptions</h1>
                        <p className="text-sm text-gray-500">{prescriptions.length} on file</p>
                    </div>
                </div>

                {prescriptions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600">
                        <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">No prescriptions yet</p>
                        <Link href="/healthcare/appointments" className="mt-3 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
                            View my appointments
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {prescriptions.map((p) => (
                            <div key={p.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-600 dark:bg-gray-700/40">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-400">Issued {p.date ? formatDate(p.date) : 'recently'}</p>
                                        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                            <Stethoscope className="h-4 w-4 text-teal-500" />
                                            {p.doctor?.full_name ?? 'Healthcare provider'}
                                            {p.doctor?.specialization && <span className="font-normal text-gray-500">· {p.doctor.specialization}</span>}
                                        </p>
                                    </div>
                                    {p.ticket_number && <span className="font-mono text-xs text-gray-400">{p.ticket_number}</span>}
                                </div>

                                <div className="px-5 py-4">
                                    {p.diagnosis && (
                                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300"><strong>Diagnosis:</strong> {p.diagnosis}</p>
                                    )}
                                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {p.items.map((item, i) => (
                                            <li key={i} className="flex items-start justify-between py-2.5 first:pt-0 last:pb-0">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">💊 {item.name}</span>
                                                <span className="ml-4 text-right text-xs text-gray-500">
                                                    {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ') || 'As directed'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    {p.follow_up_date && (
                                        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                            <CalendarClock className="h-3.5 w-3.5" /> Follow-up: {formatDate(p.follow_up_date)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
