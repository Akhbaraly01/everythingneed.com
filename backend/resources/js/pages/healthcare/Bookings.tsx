import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import EmptyState from '@/components/shared/EmptyState';
import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    CalendarCheck,
    FlaskConical,
    HeartHandshake,
    Home,
    ClipboardList,
    Pill,
    Upload,
    Video,
} from 'lucide-react';

interface MedicineOrder {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
}

const STATUS_TONE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function HealthBookings() {
    const [orders, setOrders] = useState<MedicineOrder[]>([]);
    const [ordersError, setOrdersError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: MedicineOrder[] }>('/api/pharmacy/orders')
            .then((res) => setOrders(Array.isArray(res.data) ? res.data.slice(0, 5) : []))
            .catch((e) => setOrdersError(errorMessage(e, 'Failed to load medicine orders')));
    }, []);

    return (
        <AppLayout title="Health Bookings">
            <Head title="Health Bookings" />
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/healthcare" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to Healthcare
                </Link>
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <CalendarCheck className="h-6 w-6" /> Health Bookings
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Every healthcare booking in one place — appointments, labs, medicines, home visits and custom requests.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <Video className="h-5 w-5 text-blue-600" /> Appointments & Virtual Consults
                        </p>
                        <p className="mt-1 text-sm text-gray-500">In-person and virtual visits with doctors, nurses and other professionals.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link href="/healthcare/appointments" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500">My Appointments</Link>
                            <Link href="/healthcare/virtual" className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Book Virtual</Link>
                            <Link href="/healthcare/doctors" className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Find Professionals</Link>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <FlaskConical className="h-5 w-5 text-emerald-600" /> Lab Bookings
                        </p>
                        <p className="mt-1 text-sm text-gray-500">Lab test panels, sample appointments and results follow-up.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link href="/healthcare/labs/bookings" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500">My Lab Bookings</Link>
                            <Link href="/healthcare/labs" className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Browse Lab Tests</Link>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <Home className="h-5 w-5 text-rose-600" /> Home Visits
                        </p>
                        <p className="mt-1 text-sm text-gray-500">A professional comes to your home. Priced per professional, shown before you book.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link href="/healthcare/bookings/home-visit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500">Book a Home Visit</Link>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <ClipboardList className="h-5 w-5 text-amber-600" /> Others — Custom Requests
                        </p>
                        <p className="mt-1 text-sm text-gray-500">Need something specific? Describe it and the healthcare team will respond.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link href="/healthcare/bookings/others" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500">Make a Request</Link>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <Pill className="h-5 w-5 text-violet-600" /> Prescriptions & Medicine Delivery
                        </p>
                        <Link href="/pharmacy/prescription-upload" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
                            <Upload className="h-4 w-4" /> Upload Prescription
                        </Link>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <Link href="/healthcare/prescriptions" className="text-sm font-medium text-indigo-600 hover:underline">My Prescriptions</Link>
                        <span className="text-sm text-gray-300">•</span>
                        <Link href="/healthcare/records" className="text-sm font-medium text-indigo-600 hover:underline">Health Records</Link>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent medicine orders</p>
                        {ordersError ? (
                            <p className="mt-2 text-sm text-red-600">{ordersError}</p>
                        ) : orders.length === 0 ? (
                            <EmptyState title="No medicine orders yet" hint="Upload a prescription or order from the pharmacy to get started." />
                        ) : (
                            <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-700">
                                {orders.map((o) => (
                                    <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                                        <div className="text-sm">
                                            <Link href={`/pharmacy/orders/${o.id}`} className="font-medium text-indigo-600 hover:underline">
                                                {formatPrice(o.total_amount)}
                                            </Link>
                                            <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_TONE[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {o.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-gray-500">Also see:</span>
                    <Link href="/healthcare/labs" className="font-medium text-indigo-600 hover:underline">Laboratory</Link>
                    <Link href="/healthcare/aid" className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline">
                        <HeartHandshake className="h-4 w-4" /> Healthcare Aid
                    </Link>
                    <Link href="/healthcare/documents" className="font-medium text-indigo-600 hover:underline">Documentation</Link>
                </div>
            </div>
        </AppLayout>
    );
}
