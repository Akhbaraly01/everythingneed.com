import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import ConfirmDialog from '@/components/shared/Ui';
import { Button } from '@/components/shared/Button';
import PaySheet from '@/components/shared/PaySheet';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import VideoRoom from '@/components/media/VideoRoom';
import {
    ArrowLeft, Stethoscope, Video, MapPin, FileText,
    Pill, CalendarClock, XCircle, ClipboardList,
    Receipt, MessageSquare, Send,
} from 'lucide-react';

interface Appointment {
    id: string;
    ticket_number: string;
    symptoms: string;
    description?: string;
    consultation_type: string;
    consultation_fee?: number | string;
    appointment_date?: string;
    appointment_time?: string;
    home_address?: string | null;
    status: string;
    payment_status?: string;
    paid_at?: string | null;
    created_at: string;
    images?: string[] | null;
    doctor?: { full_name: string; specialization?: string; qualification?: string } | null;
}

interface ConsultationRecord {
    id: string;
    diagnosis?: string;
    notes?: string;
    prescription_items?: Array<{ name: string; dosage?: string; frequency?: string; duration?: string }> | null;
    follow_up_date?: string | null;
}

interface PaymentInfo {
    id: string;
    reference: string | null;
    amount: number;
    currency?: string | null;
    method: string | null;
    status: string;
    paid_at: string | null;
}

interface ThreadMessage {
    id: string;
    body: string;
    author: string;
    is_mine: boolean;
    created_at: string | null;
}

interface Props {
    appointment: Appointment;
    consultation: ConsultationRecord | null;
    payment: PaymentInfo | null;
}

export default function AppointmentShow({ appointment: a, consultation, payment }: Props) {
    const [busy, setBusy] = useState(false);
    const [joining, setJoining] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [room, setRoom] = useState<{ provider: string; room: string; join_url: string } | null>(null);
    const [messages, setMessages] = useState<ThreadMessage[]>([]);
    const [threadLoading, setThreadLoading] = useState(true);
    const [threadError, setThreadError] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);

    const loadMessages = () => {
        setThreadLoading(true);
        setThreadError(null);
        api.get<{ data: ThreadMessage[] }>(`/api/appointments/${a.id}/messages`)
            .then((res) => setMessages(res.data ?? []))
            .catch((err) => setThreadError(errorMessage(err, 'Could not load the discussion')))
            .finally(() => setThreadLoading(false));
    };

    useEffect(loadMessages, [a.id]);

    const sendMessage = async () => {
        const body = draft.trim();
        if (body.length < 2 || sending) return;
        setSending(true);
        try {
            const res = await api.post<{ data: ThreadMessage[] }>(`/api/appointments/${a.id}/messages`, { body });
            setMessages(res.data ?? []);
            setDraft('');
            toast.success('Message sent');
        } catch (err) {
            toast.error(errorMessage(err, 'Could not send your message'));
        } finally {
            setSending(false);
        }
    };

    const cancel = async () => {
        setBusy(true);
        try {
            await api.post(`/api/appointments/${a.id}/cancel`);
            toast.success('Appointment cancelled');
            window.location.reload();
        } catch (err) {
            toast.error(errorMessage(err, 'Cancellation failed'));
        } finally {
            setBusy(false);
            setConfirmCancel(false);
        }
    };

    const joinVirtual = async () => {
        setJoining(true);
        try {
            const res = await api.post<{ data: { join_url: string; provider: string; room: string } }>(`/api/appointments/${a.id}/video-room`);
            setRoom(res.data);
            toast.success('Consultation room ready', { description: 'Your clinician joins the same room — stay on this page.' });
        } catch (err) {
            toast.error(errorMessage(err, 'Could not open the room'));
        } finally {
            setJoining(false);
        }
    };

    const cancellable = ['pending', 'assigned'].includes(a.status);
    const canJoin = a.consultation_type === 'virtual' && ['assigned', 'in_consultation'].includes(a.status);

    return (
        <AppLayout title="Appointment details">
            <Head title={`Appointment ${a.ticket_number}`} />
            <div className="mx-auto max-w-2xl px-4 py-8">
                <Link href="/healthcare/appointments" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600">
                    <ArrowLeft className="h-4 w-4" /> Back to appointments
                </Link>

                {/* Summary card */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="font-mono text-xs text-gray-400">{a.ticket_number}</span>
                        <span className="text-sm font-semibold text-rose-600">{formatPrice(Number(a.consultation_fee ?? 0))}</span>
                    </div>
                    <h1 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">{a.symptoms}</h1>
                    {a.description && <p className="mb-4 text-sm text-gray-500">{a.description}</p>}
                    {a.images && a.images.length > 0 && (
                        <div className="mb-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Attached evidence
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {a.images.map((url, i) => (
                                    <a key={`${a.id}-img-${i}`} href={url} target="_blank" rel="noreferrer">
                                        <img
                                            src={url}
                                            alt=""
                                            loading="lazy"
                                            className="h-20 w-20 rounded-lg border border-border object-cover hover:opacity-90"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <Info label="Type">
                            {a.consultation_type === 'virtual'
                                ? <><Video className="mr-1 inline h-4 w-4 text-sky-500" />Virtual consultation</>
                                : a.consultation_type === 'home_visit'
                                    ? <><MapPin className="mr-1 inline h-4 w-4 text-rose-500" />Home visit</>
                                    : <><MapPin className="mr-1 inline h-4 w-4 text-rose-500" />In-person visit</>}
                        </Info>
                        <Info label="Status"><span className="font-medium capitalize">{a.status.replace('_', ' ')}</span></Info>
                        <Info label="Scheduled">
                            {a.appointment_date
                                ? `${formatDate(a.appointment_date)}${a.appointment_time ? ` — ${a.appointment_time.slice(0, 5)}` : ''}`
                                : 'To be scheduled'}
                        </Info>
                        {a.home_address ? (
                            <Info label="Visit address">{a.home_address}</Info>
                        ) : null}
                        <Info label="Booked">{formatDate(a.created_at)}</Info>
                        <Info label="Doctor">
                            {a.doctor
                                ? <span className="flex items-start gap-1.5"><Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" /><span>{a.doctor.full_name}{a.doctor.specialization ? ` — ${a.doctor.specialization}` : ''}</span></span>
                                : 'Awaiting assignment'}
                        </Info>
                    </dl>

                    {canJoin && !room && (
                        <Button
                            onClick={joinVirtual}
                            loading={joining}
                            iconLeft={<Video className="h-4 w-4" />}
                            className="mt-5 w-full sm:w-auto"
                        >
                            Join virtual consultation
                        </Button>
                    )}

                    {room && (
                        <div className="mt-5 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                                    <Video className="h-4 w-4 text-sky-500" /> Live consultation room
                                </p>
                                <Button variant="ghost" size="sm" onClick={() => setRoom(null)}>Close room</Button>
                            </div>
                            <VideoRoom provider={room.provider} room={room.room} joinUrl={room.join_url} displayName="" />
                            <p className="text-xs text-gray-500">
                                Your clinician joins this same room. Keep this page open during the consultation.
                            </p>
                        </div>
                    )}

                    {cancellable && (
                        <Button
                            onClick={() => setConfirmCancel(true)}
                            disabled={busy}
                            variant="danger"
                            iconLeft={<XCircle className="h-4 w-4" />}
                            className={`gap-1.5 ${canJoin ? 'mt-3' : 'mt-5'}`}
                        >
                            Cancel appointment
                        </Button>
                    )}
                </div>

                {/* L-H-3: pay -> receipt. Paying the consultation fee happens
                    right here; once settled the receipt replaces the pay step. */}
                {a.status !== 'cancelled' && (
                    a.payment_status === 'paid' && payment ? (
                        <div
                            data-testid="appointment-receipt"
                            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 dark:border-emerald-900 dark:bg-emerald-950/20"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                                    <Receipt className="h-5 w-5 text-emerald-600" /> Payment receipt
                                </h2>
                                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white capitalize">
                                    {payment.status}
                                </span>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <Info label="Receipt for">{a.ticket_number}</Info>
                                <Info label="Amount">{formatPrice(payment.amount)}</Info>
                                <Info label="Method"><span className="capitalize">{payment.method ?? '—'}</span></Info>
                                <Info label="Paid on">{payment.paid_at ? formatDateTime(payment.paid_at) : (a.paid_at ? formatDateTime(a.paid_at) : '—')}</Info>
                                <Info label="Reference"><span className="font-mono text-xs">{payment.reference ?? payment.id.slice(0, 12)}</span></Info>
                                <Info label="Status"><span className="capitalize">{payment.status}</span></Info>
                            </dl>
                            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                Keep this receipt — it confirms your consultation fee for {a.ticket_number}.
                            </p>
                        </div>
                    ) : a.payment_status === 'refunded' && payment ? (
                        <div
                            data-testid="appointment-refunded"
                            className="mb-6 rounded-xl border border-blue-200 bg-blue-50/60 p-6 dark:border-blue-900 dark:bg-blue-950/20"
                        >
                            <h2 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                                <Receipt className="h-5 w-5 text-blue-600" /> Payment refunded
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                {formatPrice(payment.amount)} was refunded to your original payment method
                                {payment.reference ? ` (reference ${payment.reference})` : ''}.
                            </p>
                        </div>
                    ) : (
                        <div className="mb-6">
                            <PaySheet
                                endpoint={`/api/appointments/${a.id}/pay`}
                                amount={Number(a.consultation_fee ?? 0)}
                                title="Pay consultation fee"
                                onPaid={() => router.reload()}
                            />
                        </div>
                    )
                )}

                {/* Clinical record (after completion) */}
                {consultation ? (
                    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"><ClipboardList className="h-5 w-5" /> Consultation record</h2>
                        {consultation.diagnosis && (
                            <Section icon={<FileText className="h-4 w-4" />} title="Diagnosis">{consultation.diagnosis}</Section>
                        )}
                        {consultation.notes && (
                            <Section icon={<FileText className="h-4 w-4" />} title="Doctor's notes">{consultation.notes}</Section>
                        )}
                        {(consultation.prescription_items?.length ?? 0) > 0 && (
                            <div>
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400"><Pill className="h-4 w-4" /> Prescription</p>
                                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                                    {consultation.prescription_items!.map((item, i) => (
                                        <li key={i} className="px-3 py-2.5 text-sm">
                                            <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                                            <span className="ml-2 text-xs text-gray-500">
                                                {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {consultation.follow_up_date && (
                            <p className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                <CalendarClock className="h-4 w-4" /> Follow-up recommended on {formatDate(consultation.follow_up_date)}
                            </p>
                        )}
                    </div>
                ) : a.status === 'completed' ? (
                    <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-700/40">Consultation record is being finalised.</p>
                ) : (
                    <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-700/40">
                        The clinical record will appear here after your consultation.
                    </p>
                )}

                {/* L-H-3: appointment discussion thread — schedule changes or
                    issue reports, visible to the patient, doctor and support. */}
                <div
                    data-testid="appointment-discussion"
                    className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
                >
                    <h2 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                        <MessageSquare className="h-5 w-5" /> Questions or an issue with this booking?
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Discuss your schedule or report an issue — your doctor and support can reply here.
                    </p>

                    <div className="mt-4 space-y-3">
                        {threadLoading ? (
                            <p className="text-sm text-gray-500" data-testid="appointment-discussion-loading">Loading discussion…</p>
                        ) : threadError ? (
                            <div className="text-sm text-red-600">
                                {threadError}
                                <Button onClick={loadMessages} variant="ghost" size="sm" className="ml-2">Retry</Button>
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="text-sm text-gray-500" data-testid="appointment-discussion-empty">
                                No messages yet. Ask about your schedule or report an issue below.
                            </p>
                        ) : (
                            messages.map((m) => (
                                <div
                                    key={m.id}
                                    data-testid={`appointment-message-${m.id}`}
                                    className={`rounded-lg px-3 py-2.5 text-sm ${
                                        m.is_mine
                                            ? 'ml-8 bg-blue-50 dark:bg-blue-950/30'
                                            : 'mr-8 bg-gray-50 dark:bg-gray-700/40'
                                    }`}
                                >
                                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                                        <span className="font-medium text-gray-700 dark:text-gray-200">
                                            {m.is_mine ? 'You' : m.author}
                                        </span>
                                        <span>{m.created_at ? formatDateTime(m.created_at) : ''}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{m.body}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-4">
                        <textarea
                            data-testid="appointment-issue-input"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={3}
                            maxLength={2000}
                            placeholder="Describe your question or issue (schedule change, symptoms, billing…)"
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                            type="button"
                            data-testid="appointment-issue-send"
                            onClick={() => void sendMessage()}
                            disabled={sending || draft.trim().length < 2}
                            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            {sending ? 'Sending…' : 'Send message'}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmCancel}
                title="Cancel appointment?"
                description="Your practitioner will be notified. This cannot be undone."
                confirmLabel="Cancel appointment"
                danger
                busy={busy}
                onConfirm={() => void cancel()}
                onCancel={() => setConfirmCancel(false)}
            />
        </AppLayout>
    );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
            <dd className="mt-0.5 text-gray-900 dark:text-white">{children}</dd>
        </div>
    );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{icon} {title}</p>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{children}</p>
        </div>
    );
}
