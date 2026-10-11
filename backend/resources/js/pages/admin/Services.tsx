import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ClipboardList, X, RefreshCw, Inbox } from 'lucide-react';
import { api, errorMessage, rows } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog, { EmptyState, StatusBadge, TableSkeleton } from '@/components/shared/Ui';

const CATEGORIES = [
    'building', 'cleaning', 'food', 'transport', 'healthcare', 'learning',
    'agriculture', 'events', 'it', 'design', 'legal', 'finance', 'beauty', 'repair',
];

const PRICING_MODES = ['fixed', 'hourly', 'quote'] as const;
const STATUSES = ['active', 'draft', 'inactive'] as const;
const FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select', 'boolean'] as const;

interface BookingFieldDef {
    label: string;
    type: string;
    required: boolean;
}

interface ServiceRow {
    id: string;
    name: string;
    category: string;
    description: string | null;
    image_url: string | null;
    provider: string | null;
    pricing_mode: string;
    base_price: string | number;
    currency: string;
    location: string | null;
    availability: { days?: string; hours?: string } | null;
    requires_booking: boolean;
    booking_fields: BookingFieldDef[] | null;
    documents: string[] | null;
    requires_payment: boolean;
    cancellation_rules: string | null;
    delivery_rules: string | null;
    status: string;
}

interface ServiceBookingRow {
    id: string;
    booking_number: string;
    status: string;
    payment_status: string;
    amount: string | number;
    currency: string;
    notes: string | null;
    created_at: string;
    service?: { id: string; name: string; category: string } | null;
    user?: { id: string; name: string; email: string } | null;
}

interface EditorState {
    id: string | null;
    name: string;
    category: string;
    description: string;
    image_url: string;
    provider: string;
    pricing_mode: string;
    base_price: string;
    currency: string;
    location: string;
    availability_days: string;
    availability_hours: string;
    requires_booking: boolean;
    requires_payment: boolean;
    booking_fields: BookingFieldDef[];
    documents: string;
    cancellation_rules: string;
    delivery_rules: string;
    status: string;
}

const emptyEditor = (): EditorState => ({
    id: null,
    name: '',
    category: 'building',
    description: '',
    image_url: '',
    provider: '',
    pricing_mode: 'fixed',
    base_price: '0',
    currency: 'USD',
    location: '',
    availability_days: '',
    availability_hours: '',
    requires_booking: true,
    requires_payment: false,
    booking_fields: [],
    documents: '',
    cancellation_rules: '',
    delivery_rules: '',
    status: 'active',
});

const money = (value: string | number, currency: string): string => `${currency} ${Number(value).toFixed(2)}`;

export default function AdminServices() {
    const [tab, setTab] = useState<'services' | 'bookings'>('services');
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [bookings, setBookings] = useState<ServiceBookingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editor, setEditor] = useState<EditorState | null>(null);
    const [saving, setSaving] = useState(false);
    const [editorError, setEditorError] = useState('');
    const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);
    const [confirmBusy, setConfirmBusy] = useState(false);

    const loadServices = async () => {
        try {
            const res = await api.get<{ data: ServiceRow[] }>('/api/admin/services?per_page=100');
            setServices(rows<ServiceRow>(res));
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to load services'));
        } finally {
            setLoading(false);
        }
    };

    const loadBookings = async () => {
        try {
            const res = await api.get<{ data: ServiceBookingRow[] }>('/api/admin/services-bookings?per_page=100');
            setBookings(rows<ServiceBookingRow>(res));
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to load bookings'));
        }
    };

    useEffect(() => {
        void loadServices();
        void loadBookings();
    }, []);

    const openCreate = () => {
        setEditorError('');
        setEditor(emptyEditor());
    };

    const openEdit = (row: ServiceRow) => {
        setEditorError('');
        setEditor({
            id: row.id,
            name: row.name,
            category: row.category,
            description: row.description ?? '',
            image_url: row.image_url ?? '',
            provider: row.provider ?? '',
            pricing_mode: row.pricing_mode,
            base_price: String(row.base_price ?? 0),
            currency: row.currency ?? 'USD',
            location: row.location ?? '',
            availability_days: row.availability?.days ?? '',
            availability_hours: row.availability?.hours ?? '',
            requires_booking: Boolean(row.requires_booking),
            requires_payment: Boolean(row.requires_payment),
            booking_fields: (row.booking_fields ?? []).map((f) => ({
                label: f.label,
                type: f.type && FIELD_TYPES.includes(f.type as never) ? f.type : 'text',
                required: Boolean(f.required),
            })),
            documents: (row.documents ?? []).join('\n'),
            cancellation_rules: row.cancellation_rules ?? '',
            delivery_rules: row.delivery_rules ?? '',
            status: row.status,
        });
    };

    const saveEditor = async () => {
        if (!editor) return;
        if (!editor.name.trim()) {
            setEditorError('Service name is required.');
            return;
        }
        if (!editor.category.trim()) {
            setEditorError('Category is required.');
            return;
        }
        if (Number.isNaN(Number(editor.base_price)) || Number(editor.base_price) < 0) {
            setEditorError('Base price must be a non-negative number.');
            return;
        }
        setSaving(true);
        setEditorError('');
        const payload = {
            name: editor.name.trim(),
            category: editor.category.trim().toLowerCase(),
            description: editor.description.trim() || null,
            image_url: editor.image_url.trim() || null,
            provider: editor.provider.trim() || null,
            pricing_mode: editor.pricing_mode,
            base_price: Number(editor.base_price),
            currency: editor.currency.trim().toUpperCase() || 'USD',
            location: editor.location.trim() || null,
            availability: editor.availability_days || editor.availability_hours
                ? {
                      ...(editor.availability_days ? { days: editor.availability_days } : {}),
                      ...(editor.availability_hours ? { hours: editor.availability_hours } : {}),
                  }
                : null,
            requires_booking: editor.requires_booking,
            requires_payment: editor.requires_payment,
            booking_fields: editor.booking_fields.filter((f) => f.label.trim()),
            documents: editor.documents.split('\n').map((d) => d.trim()).filter(Boolean),
            cancellation_rules: editor.cancellation_rules.trim() || null,
            delivery_rules: editor.delivery_rules.trim() || null,
            status: editor.status,
        };
        try {
            if (editor.id) {
                await api.put(`/api/admin/services/${editor.id}`, payload);
                toast.success('Service updated.');
            } else {
                await api.post('/api/admin/services', payload);
                toast.success('Service created. It is now discoverable and bookable.');
            }
            setEditor(null);
            await Promise.all([loadServices(), loadBookings()]);
        } catch (e) {
            setEditorError(errorMessage(e, 'Could not save service'));
        } finally {
            setSaving(false);
        }
    };

    const deleteService = async () => {
        if (!confirm) return;
        setConfirmBusy(true);
        try {
            await api.del(`/api/admin/services/${confirm.id}`);
            toast.success('Service deleted.');
            setConfirm(null);
            await Promise.all([loadServices(), loadBookings()]);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete service'));
        } finally {
            setConfirmBusy(false);
        }
    };

    const updateBooking = async (booking: ServiceBookingRow, status: string) => {
        try {
            await api.put(`/api/admin/services-bookings/${booking.id}`, { status });
            toast.success(`Booking ${booking.booking_number} → ${status}.`);
            await loadBookings();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not update booking'));
        }
    };

    const setField = (index: number, patch: Partial<BookingFieldDef>) => {
        setEditor((prev) =>
            prev
                ? {
                      ...prev,
                      booking_fields: prev.booking_fields.map((f, i) => (i === index ? { ...f, ...patch } : f)),
                  }
                : prev,
        );
    };

    return (
        <AdminLayout title="Services">
            <Head title="Admin Services" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services</h1>
                        <p className="text-sm text-gray-500">
                            Create any supported service from the dashboard (spec 39) - it becomes discoverable and
                            bookable in the matching service UI automatically (spec 100).
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                void loadServices();
                                void loadBookings();
                            }}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            <Plus className="h-4 w-4" /> New Service
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    {(['services', 'bookings'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                tab === t
                                    ? 'bg-indigo-600 text-white'
                                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {t === 'services' ? 'Services' : 'Bookings'}
                            {t === 'bookings' && bookings.length > 0 ? ` (${bookings.length})` : ''}
                        </button>
                    ))}
                </div>

                {tab === 'services' ? (
                    loading ? (
                        <TableSkeleton rows={4} cols={6} />
                    ) : services.length === 0 ? (
                        <EmptyState
                            icon={<ClipboardList className="h-10 w-10" />}
                            title="No services yet"
                            description="Create your first service (e.g. Home Cleaning in Building Services, Bauchi) with pricing, availability and booking rules."
                            action={
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                >
                                    New Service
                                </button>
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Location</th>
                                        <th className="px-4 py-3">Pricing</th>
                                        <th className="px-4 py-3">Booking</th>
                                        <th className="px-4 py-3">Payment</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {services.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
                                            <td className="px-4 py-3 text-gray-500">{row.category}</td>
                                            <td className="px-4 py-3 text-gray-500">{row.location ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {money(row.base_price, row.currency || 'USD')}
                                                <span className="ml-1 text-xs text-gray-400">/ {row.pricing_mode}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{row.requires_booking ? 'Required' : 'Not required'}</td>
                                            <td className="px-4 py-3 text-gray-500">{row.requires_payment ? 'Required' : 'Free'}</td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(row)}
                                                        title="Edit service"
                                                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirm({ id: row.id, name: row.name })}
                                                        title="Delete service"
                                                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : bookings.length === 0 ? (
                    <EmptyState
                        icon={<Inbox className="h-10 w-10" />}
                        title="No bookings yet"
                        description="Customer bookings for admin-created services will appear here."
                    />
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3">Booking</th>
                                    <th className="px-4 py-3">Service</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Payment</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {bookings.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.booking_number}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.service?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {row.user?.name ?? '—'}
                                            <div className="text-xs text-gray-400">{row.user?.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{money(row.amount, row.currency || 'USD')}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={row.status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={row.payment_status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                {row.status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void updateBooking(row, 'confirmed')}
                                                        className="rounded-lg border border-green-200 px-2.5 py-1.5 text-xs text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
                                                    >
                                                        Confirm
                                                    </button>
                                                )}
                                                {row.status === 'confirmed' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void updateBooking(row, 'completed')}
                                                        className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                {(row.status === 'pending' || row.status === 'confirmed') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void updateBooking(row, 'cancelled')}
                                                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {editor && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setEditor(null)} />
                    <div className="relative z-10 w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editor.id ? 'Edit Service' : 'New Service'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setEditor(null)}
                                disabled={saving}
                                aria-label="Close"
                                className="rounded p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Service name *</span>
                                    <input
                                        value={editor.name}
                                        onChange={(e) => setEditor((p) => (p ? { ...p, name: e.target.value } : p))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="Home Cleaning"
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Category *</span>
                                    <input
                                        list="service-categories"
                                        value={editor.category}
                                        onChange={(e) => setEditor((p) => (p ? { ...p, category: e.target.value } : p))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="building"
                                    />
                                    <datalist id="service-categories">
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c} />
                                        ))}
                                    </datalist>
                                </label>
                            </div>

                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Description</span>
                                <textarea
                                    value={editor.description}
                                    onChange={(e) => setEditor((p) => (p ? { ...p, description: e.target.value } : p))}
                                    rows={3}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    placeholder="What does the service include?"
                                />
                            </label>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Image URL</span>
                                    <input
                                        value={editor.image_url}
                                        onChange={(e) => setEditor((p) => (p ? { ...p, image_url: e.target.value } : p))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="https://…"
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Provider</span>
                                    <input
                                        value={editor.provider}
                                        onChange={(e) => setEditor((p) => (p ? { ...p, provider: e.target.value } : p))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="EverythingNeed Partners"
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Location</span>
                                    <input
                                        value={editor.location}
                                        onChange={(e) => setEditor((p) => (p ? { ...p, location: e.target.value } : p))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="Bauchi"
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Status</span>
                                    <select
                                        value={editor.status}
                                        onChange={(e) => setEditor((p) => (p ? { ...p, status: e.target.value } : p))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    >
                                        {STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Pricing</div>
                                <div className="grid gap-3 sm:grid-cols-4">
                                    <label className="block text-sm">
                                        <span className="text-xs text-gray-500">Mode *</span>
                                        <select
                                            value={editor.pricing_mode}
                                            onChange={(e) => setEditor((p) => (p ? { ...p, pricing_mode: e.target.value } : p))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        >
                                            {PRICING_MODES.map((m) => (
                                                <option key={m} value={m}>
                                                    {m}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block text-sm">
                                        <span className="text-xs text-gray-500">Base price *</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editor.base_price}
                                            onChange={(e) => setEditor((p) => (p ? { ...p, base_price: e.target.value } : p))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    </label>
                                    <label className="block text-sm">
                                        <span className="text-xs text-gray-500">Currency</span>
                                        <input
                                            value={editor.currency}
                                            onChange={(e) =>
                                                setEditor((p) => (p ? { ...p, currency: e.target.value.toUpperCase().slice(0, 3) } : p))
                                            }
                                            maxLength={3}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm uppercase dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    </label>
                                    <label className="block text-sm">
                                        <span className="text-xs text-gray-500">Availability (days)</span>
                                        <input
                                            value={editor.availability_days}
                                            onChange={(e) => setEditor((p) => (p ? { ...p, availability_days: e.target.value } : p))}
                                            placeholder="Mon-Sat"
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    </label>
                                </div>
                                <label className="mt-3 block text-sm">
                                    <span className="text-xs text-gray-500">Availability (hours)</span>
                                    <input
                                        value={editor.availability_hours}
                                        onChange={(e) => setEditor((p) => (p ? { ...p, availability_hours: e.target.value } : p))}
                                        placeholder="08:00-18:00"
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    />
                                </label>
                            </div>

                            <div className="flex flex-wrap gap-6 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={editor.requires_booking}
                                        onChange={(e) => setEditor((p) => (p ? { ...p, requires_booking: e.target.checked } : p))}
                                    />
                                    Booking required
                                </label>
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={editor.requires_payment}
                                        onChange={(e) => setEditor((p) => (p ? { ...p, requires_payment: e.target.checked } : p))}
                                    />
                                    Payment required
                                </label>
                            </div>

                            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Booking form fields</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditor((p) =>
                                                p ? { ...p, booking_fields: [...p.booking_fields, { label: '', type: 'text', required: true }] } : p,
                                            )
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add field
                                    </button>
                                </div>
                                {editor.booking_fields.length === 0 ? (
                                    <p className="text-xs text-gray-500">No custom fields - bookings collect notes only.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {editor.booking_fields.map((f, index) => (
                                            <div key={index} className="flex flex-wrap items-center gap-2">
                                                <input
                                                    value={f.label}
                                                    onChange={(e) => setField(index, { label: e.target.value })}
                                                    placeholder="Label (e.g. Number of rooms)"
                                                    className="w-60 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                                />
                                                <select
                                                    value={f.type}
                                                    onChange={(e) => setField(index, { type: e.target.value })}
                                                    className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                                >
                                                    {FIELD_TYPES.map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </select>
                                                <label className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                    <input
                                                        type="checkbox"
                                                        checked={f.required}
                                                        onChange={(e) => setField(index, { required: e.target.checked })}
                                                    />
                                                    required
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditor((p) =>
                                                            p ? { ...p, booking_fields: p.booking_fields.filter((_, i) => i !== index) } : p,
                                                        )
                                                    }
                                                    title="Remove field"
                                                    className="ml-auto rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Required documents (one per line)</span>
                                <textarea
                                    value={editor.documents}
                                    onChange={(e) => setEditor((p) => (p ? { ...p, documents: e.target.value } : p))}
                                    rows={2}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    placeholder="Valid ID&#10;Proof of address"
                                />
                            </label>

                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Cancellation rules</span>
                                <textarea
                                    value={editor.cancellation_rules}
                                    onChange={(e) => setEditor((p) => (p ? { ...p, cancellation_rules: e.target.value } : p))}
                                    rows={2}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    placeholder="Free cancellation up to 24 hours before the appointment."
                                />
                            </label>

                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Delivery rules</span>
                                <textarea
                                    value={editor.delivery_rules}
                                    onChange={(e) => setEditor((p) => (p ? { ...p, delivery_rules: e.target.value } : p))}
                                    rows={2}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    placeholder="Service delivered on-site within 48 hours of confirmation."
                                />
                            </label>
                        </div>

                        {editorError && <p className="mt-3 text-sm text-red-600">{editorError}</p>}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditor(null)}
                                disabled={saving}
                                className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void saveEditor()}
                                disabled={saving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                            >
                                {saving ? 'Saving…' : editor.id ? 'Save changes' : 'Create service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirm !== null}
                title="Delete service?"
                description={confirm ? `"${confirm.name}" will be removed from discovery and booking.` : ''}
                confirmLabel="Delete"
                danger
                busy={confirmBusy}
                onConfirm={() => void deleteService()}
                onCancel={() => setConfirm(null)}
            />
        </AdminLayout>
    );
}
