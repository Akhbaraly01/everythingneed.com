import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { formatDate } from '@/lib/utils';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Pill, CalendarClock, Stethoscope, FileText, Send, CheckCircle2 } from 'lucide-react';

interface PrescriptionItem {
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
}

interface PrescriptionView {
    id: string;
    code: string;
    status: 'active' | 'filled' | 'expired';
    is_expired: boolean;
    expires_at?: string | null;
    created_at?: string | null;
    notes?: string | null;
    items: PrescriptionItem[];
    diagnosis?: string | null;
    follow_up_date?: string | null;
    doctor?: { full_name: string; specialization?: string } | null;
}

interface Props {
    prescriptions: PrescriptionView[];
}

function statusChip(p: PrescriptionView) {
    if (p.status === 'filled') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Filled
            </span>
        );
    }
    if (p.status === 'expired' || p.is_expired) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                Expired
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            Active
        </span>
    );
}

export default function HealthcarePrescriptions({ prescriptions }: Props) {
    const [ordering, setOrdering] = useState<string | null>(null);

    const sendToPharmacy = async (p: PrescriptionView) => {
        setOrdering(p.id);
        try {
            await api.post(`/api/prescriptions/${p.id}/order`, {
                items: p.items.map((it) => ({ name: it.name, quantity: 1 })),
            });
            toast.success('Sent to pharmacy');
            router.reload({ only: ['prescriptions'] });
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to send to pharmacy'));
        } finally {
            setOrdering(null);
        }
    };

    return (
        <AppLayout title="My prescriptions">
            <Head title="My prescriptions" />
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="mb-4 flex flex-wrap gap-2 text-sm">
                    <Link href="/healthcare/bookings" className="font-medium text-indigo-600 hover:underline">← Health Bookings</Link>
                    <Link href="/healthcare/records" className="font-medium text-indigo-600 hover:underline">Health Records</Link>
                </div>
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
                                        <p className="font-mono text-xs uppercase tracking-wide text-gray-400">{p.code}</p>
                                        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                                            <Stethoscope className="h-4 w-4 text-teal-500" />
                                            {p.doctor?.full_name ?? 'Healthcare provider'}
                                            {p.doctor?.specialization && <span className="font-normal text-gray-500">· {p.doctor.specialization}</span>}
                                        </p>
                                    </div>
                                    {statusChip(p)}
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

                                    {(p.expires_at || p.follow_up_date) && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {p.expires_at && (
                                                <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                    <CalendarClock className="h-3.5 w-3.5" /> Expires: {formatDate(p.expires_at)}
                                                </span>
                                            )}
                                            {p.follow_up_date && (
                                                <span className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                                    <CalendarClock className="h-3.5 w-3.5" /> Follow-up: {formatDate(p.follow_up_date)}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {p.status === 'active' && !p.is_expired && (
                                        <button
                                            onClick={() => sendToPharmacy(p)}
                                            disabled={ordering === p.id}
                                            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                                        >
                                            <Send className="h-4 w-4" />
                                            {ordering === p.id ? 'Ordering…' : 'Send to pharmacy'}
                                        </button>
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
