import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from '@/components/shared/Image';
import PaySheet from '@/components/shared/PaySheet';
import { User } from 'lucide-react';

interface Expert {
    id: string;
    name: string;
    specialty: string;
    bio?: string;
    image_url?: string;
    hourly_rate?: number;
    years_experience?: number;
}

interface ExpertBookingProps {
    expert_id: string;
}

export default function ExpertBooking({ expert_id }: ExpertBookingProps) {
    const { auth } = usePage().props as { auth?: { id?: string; user?: { id?: string } } | null };
    const isLoggedIn = Boolean(auth?.id ?? auth?.user?.id);

    const [expert, setExpert] = useState<Expert | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');
    const [mode, setMode] = useState<'virtual' | 'in_person'>('virtual');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Spec 60/97: booking -> payment. After creating the booking the page
    // switches to the payment step.
    const [created, setCreated] = useState<{ id: string; amount: number } | null>(null);

    useEffect(() => {
        api.get<{ data: Expert }>(`/api/experts/${expert_id}`)
            .then((res) => setExpert(res.data))
            .catch(() => setExpert(null))
            .finally(() => setLoading(false));
    }, [expert_id]);

    const handleBook = async () => {
        if (!isLoggedIn) {
            router.visit('/login');
            return;
        }
        if (!date || !time) return;
        setSubmitting(true);
        try {
            const res = await api.post<{ data: { id: string; amount: number } }>(`/api/experts/${expert_id}/book`, {
                scheduled_date: date,
                scheduled_time: time,
                mode,
                notes: notes.trim() || undefined,
            });
            setCreated(res.data);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to book'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <AppLayout title="Book Expert"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    }
    if (!expert) {
        return <AppLayout title="Book Expert"><p className="p-12 text-center text-red-500">Expert not found</p></AppLayout>;
    }

    return (
        <AppLayout>
            <Head title={`Book ${expert.name}`} />
            <div className="max-w-3xl space-y-6">
                <Link href={`/experts/${expert.id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to expert
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
                            {expert.image_url ? <Image src={expert.image_url} alt="" className="h-full w-full object-cover" /> :
                                <div className="flex h-full w-full items-center justify-center text-gray-400"><User className="h-10 w-10" /></div>}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{expert.name}</h1>
                            <p className="text-indigo-600">{expert.specialty}</p>
                            {expert.years_experience && <p className="text-sm text-gray-500">{expert.years_experience} years experience</p>}
                        </div>
                    </div>
                    {expert.hourly_rate != null && (
                        <p className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                            Session fee: {formatPrice(expert.hourly_rate)}
                        </p>
                    )}
                </div>

                {created ? (
                    <>
                        <PaySheet
                            endpoint={`/api/experts/bookings/${created.id}/pay`}
                            amount={created.amount}
                            title="Confirm your session"
                            onPaid={() => router.visit('/experts/bookings')}
                        />
                        <button
                            onClick={() => router.visit('/experts/bookings')}
                            className="w-full rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Pay later - keep it pending
                        </button>
                    </>
                ) : !isLoggedIn ? (
                    <div className="rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sign in to continue</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Booking a session is tied to your account — sign in to pick a slot and pay.
                        </p>
                        <Link
                            href="/login"
                            className="mt-4 inline-flex rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            Sign in
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Book a session</h2>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date *</label>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time *</label>
                                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mode *</label>
                            <div className="mt-2 flex gap-4">
                                {(['virtual', 'in_person'] as const).map((m) => (
                                    <label key={m} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                                        mode === m ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                                    }`}>
                                        <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="text-indigo-600" />
                                        {m === 'virtual' ? 'Virtual' : 'In person'}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="What would you like to discuss?"
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>

                        <button onClick={handleBook} disabled={submitting || !date || !time}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                            <CalendarCheck className="h-5 w-5" /> {submitting ? 'Booking...' : 'Book Session'}
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
