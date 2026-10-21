import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ClipboardList, X, RefreshCw, Inbox } from 'lucide-react';
import { api, errorMessage, rows } from '@/lib/api';
import { useAuthPermissions } from '@/lib/permissions';
import { useConfirm } from '@/lib/confirm';
import { toast } from 'sonner';
import ConfirmDialog, { EmptyState, StatusBadge, TableSkeleton } from '@/components/shared/Ui';
import MediaUploadInput from '@/components/shared/MediaUploadInput';

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
    category_id: string | null;
    categoryRef?: { id: string; name: string; slug: string } | null;
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

interface ServiceCategoryRow {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    sort_order: number;
    parent_id: string | null;
    is_active: boolean;
    services_count?: number;
    children_count?: number;
    children?: ServiceCategoryRow[];
}

interface CategoryEditorState {
    id: string | null;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    sort_order: string;
    parent_id: string;
    is_active: boolean;
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
    category_id: string;
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
    category: '',
    category_id: '',
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

const emptyCategoryEditor = (): CategoryEditorState => ({
    id: null,
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '',
    sort_order: '0',
    parent_id: '',
    is_active: true,
});

const money = (value: string | number, currency: string): string => `${currency} ${Number(value).toFixed(2)}`;

export default function AdminServices() {
    const { can } = useAuthPermissions();
    const canManage = can('services.overview.manage');

    const ask = useConfirm();
    const [tab, setTab] = useState<'services' | 'bookings' | 'categories'>('services');
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [bookings, setBookings] = useState<ServiceBookingRow[]>([]);
    const [categories, setCategories] = useState<ServiceCategoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editor, setEditor] = useState<EditorState | null>(null);
    const [saving, setSaving] = useState(false);
    const [editorError, setEditorError] = useState('');
    const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);
    const [confirmBusy, setConfirmBusy] = useState(false);
    const [catEditor, setCatEditor] = useState<CategoryEditorState | null>(null);
    const [catSaving, setCatSaving] = useState(false);
    const [catError, setCatError] = useState('');

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

    const loadCategories = async () => {
        try {
            const res = await api.get<{ data: ServiceCategoryRow[] }>('/api/admin/service-categories');
            // The admin endpoint returns a flat list (roots AND children, the
            // inactive ones included); order it root-first for display.
            const flat = rows<ServiceCategoryRow>(res);
            const ordered: ServiceCategoryRow[] = [];
            for (const root of flat.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)) {
                ordered.push(root);
                ordered.push(...flat.filter((c) => c.parent_id === root.id).sort((a, b) => a.sort_order - b.sort_order));
            }
            setCategories(ordered);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to load service categories'));
        }
    };

    useEffect(() => {
        void loadServices();
        void loadBookings();
        void loadCategories();
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
            category_id: row.category_id ?? '',
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
        if (!editor.category_id && !editor.category.trim()) {
            setEditorError('Pick a category from the taxonomy (or keep a legacy free-text category).');
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
            category: editor.category_id ? undefined : editor.category.trim().toLowerCase(),
            category_id: editor.category_id || null,
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

    const openCategoryEditor = (cat?: ServiceCategoryRow) => {
        setCatError('');
        setCatEditor(
            cat
                ? {
                      id: cat.id,
                      name: cat.name,
                      slug: cat.slug,
                      description: cat.description ?? '',
                      icon: cat.icon ?? '',
                      color: cat.color ?? '',
                      sort_order: String(cat.sort_order ?? 0),
                      parent_id: cat.parent_id ?? '',
                      is_active: cat.is_active,
                  }
                : emptyCategoryEditor(),
        );
    };

    const saveCategory = async () => {
        if (!catEditor) return;
        if (!catEditor.name.trim()) {
            setCatError('Name is required.');
            return;
        }
        if (!catEditor.slug.trim()) {
            setCatError('Slug is required.');
            return;
        }
        setCatSaving(true);
        setCatError('');
        const payload = {
            name: catEditor.name.trim(),
            slug: catEditor.slug.trim().toLowerCase(),
            description: catEditor.description.trim() || null,
            icon: catEditor.icon.trim() || null,
            color: catEditor.color.trim() || null,
            sort_order: Number(catEditor.sort_order) || 0,
            parent_id: catEditor.parent_id || null,
            is_active: catEditor.is_active,
        };
        try {
            if (catEditor.id) {
                await api.put(`/api/admin/service-categories/${catEditor.id}`, payload);
                toast.success('Category updated.');
            } else {
                await api.post('/api/admin/service-categories', payload);
                toast.success('Category created.');
            }
            setCatEditor(null);
            await Promise.all([loadCategories(), loadServices()]);
        } catch (e) {
            setCatError(errorMessage(e, 'Could not save category'));
        } finally {
            setCatSaving(false);
        }
    };

    const toggleCategoryActive = async (cat: ServiceCategoryRow) => {
        try {
            await api.put(`/api/admin/service-categories/${cat.id}`, { is_active: !cat.is_active });
            toast.success(cat.is_active ? 'Category deactivated.' : 'Category activated.');
            await Promise.all([loadCategories(), loadServices()]);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not toggle category'));
        }
    };

    const deleteCategory = async (cat: ServiceCategoryRow) => {
        if (
            !(await ask({
                title: 'Delete this category?',
                description: 'Categories that still have services or subcategories are protected - deactivate them instead.',
                danger: true,
            }))
        ) {
            return;
        }
        try {
            await api.del(`/api/admin/service-categories/${cat.id}`);
            toast.success('Category deleted.');
            await Promise.all([loadCategories(), loadServices()]);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete category'));
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
                        {canManage && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                                <Plus className="h-4 w-4" /> New Service
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {(['services', 'bookings', 'categories'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            data-testid={`tab-${t}`}
                            onClick={() => setTab(t)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                tab === t
                                    ? 'bg-indigo-600 text-white'
                                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {t === 'services' ? 'Services' : t === 'bookings' ? 'Bookings' : 'Categories'}
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
                                canManage ? (
                                    <button
                                        type="button"
                                        onClick={openCreate}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                    >
                                        New Service
                                    </button>
                                ) : undefined
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
                                            <td className="px-4 py-3 text-gray-500">{row.categoryRef?.name ?? row.category}</td>
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
                                                {canManage ? (
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
                                                ) : (
                                                    <span className="text-xs text-gray-400">View only</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : tab === 'categories' ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-gray-500">
                                Categories and subcategories power the icon grids on the public services pages (spec 39/100).
                            </p>
                            {canManage && (
                                <button
                                    type="button"
                                    data-testid="new-service-category"
                                    onClick={() => openCategoryEditor()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                >
                                    <Plus className="h-4 w-4" /> New Category
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Parent</th>
                                        <th className="px-4 py-3">Icon</th>
                                        <th className="px-4 py-3">Color</th>
                                        <th className="px-4 py-3">Order</th>
                                        <th className="px-4 py-3">Active</th>
                                        <th className="px-4 py-3">Use</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {categories.map((cat) => (
                                        <tr
                                            key={cat.id}
                                            data-testid={`category-row-${cat.slug}`}
                                            className={cat.parent_id ? 'bg-gray-50/60 dark:bg-gray-900/40' : ''}
                                        >
                                            <td className="px-4 py-3">
                                                <span
                                                    className={
                                                        cat.parent_id
                                                            ? 'pl-5 text-gray-600 dark:text-gray-300'
                                                            : 'font-medium text-gray-900 dark:text-white'
                                                    }
                                                >
                                                    {cat.parent_id ? `— ${cat.name}` : cat.name}
                                                </span>
                                                <div className="font-mono text-xs text-gray-400">{cat.slug}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {cat.parent_id
                                                    ? categories.find((c) => c.id === cat.parent_id)?.name ?? '—'
                                                    : 'Top level'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.icon ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                {cat.color ? (
                                                    <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                                                        <span
                                                            className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-600"
                                                            style={{ backgroundColor: cat.color }}
                                                        />
                                                        {cat.color}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{cat.sort_order}</td>
                                            <td className="px-4 py-3 text-gray-500">{cat.is_active ? 'yes' : 'no'}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {cat.services_count ?? 0} services · {cat.children_count ?? 0} subcategories
                                            </td>
                                            <td className="px-4 py-3">
                                                {canManage ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openCategoryEditor(cat)}
                                                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void toggleCategoryActive(cat)}
                                                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                        >
                                                            {cat.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void deleteCategory(cat)}
                                                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-900/20"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">View only</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-3 text-gray-500" colSpan={8}>
                                                No categories yet - create the first one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {catEditor && (
                            <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {catEditor.id ? 'Edit category' : 'New category'}
                                </h3>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <label className="block text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">Name *</span>
                                        <input
                                            data-testid="category-name-input"
                                            value={catEditor.name}
                                            onChange={(e) => setCatEditor((p) => (p ? { ...p, name: e.target.value } : p))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    </label>
                                    <label className="block text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">Slug *</span>
                                        <input
                                            value={catEditor.slug}
                                            onChange={(e) => setCatEditor((p) => (p ? { ...p, slug: e.target.value } : p))}
                                            placeholder="lowercase-hyphens"
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    </label>
                                    <label className="block text-sm sm:col-span-2">
                                        <span className="text-gray-600 dark:text-gray-300">Description</span>
                                        <textarea
                                            value={catEditor.description}
                                            onChange={(e) => setCatEditor((p) => (p ? { ...p, description: e.target.value } : p))}
                                            rows={2}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    </label>
                                    <label className="block text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">Icon (lucide key)</span>
                                        <input
                                            value={catEditor.icon}
                                            onChange={(e) => setCatEditor((p) => (p ? { ...p, icon: e.target.value } : p))}
                                            placeholder="sparkles"
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    </label>
                                    <label className="block text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">Color</span>
                                        <input
                                            value={catEditor.color}
                                            onChange={(e) => setCatEditor((p) => (p ? { ...p, color: e.target.value } : p))}
                                            placeholder="#0EA5E9"
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    </label>
                                    <label className="block text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">Sort order</span>
                                        <input
                                            type="number"
                                            value={catEditor.sort_order}
                                            onChange={(e) => setCatEditor((p) => (p ? { ...p, sort_order: e.target.value } : p))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    </label>
                                    <label className="block text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">Parent</span>
                                        <select
                                            value={catEditor.parent_id}
                                            onChange={(e) => setCatEditor((p) => (p ? { ...p, parent_id: e.target.value } : p))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        >
                                            <option value="">None (top level)</option>
                                            {categories
                                                .filter((c) => !c.parent_id && c.id !== catEditor.id)
                                                .map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 sm:col-span-2 dark:text-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={catEditor.is_active}
                                            onChange={(e) => setCatEditor((p) => (p ? { ...p, is_active: e.target.checked } : p))}
                                        />
                                        Active (visible publicly, shown in the icon grids)
                                    </label>
                                </div>
                                {catError && <p className="mt-3 text-sm text-red-600">{catError}</p>}
                                <div className="mt-4 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCatEditor(null)}
                                        disabled={catSaving}
                                        className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        data-testid="save-category"
                                        onClick={() => void saveCategory()}
                                        disabled={catSaving}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                                    >
                                        {catSaving ? 'Saving…' : catEditor.id ? 'Save changes' : 'Create category'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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
                                            {canManage ? (
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
                                            ) : (
                                                <span className="text-xs text-gray-400">View only</span>
                                            )}
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
                                    <select
                                        data-testid="service-category-select"
                                        value={editor.category_id}
                                        onChange={(e) =>
                                            setEditor((p) => {
                                                if (!p) return p;
                                                const picked = categories.find((c) => c.id === e.target.value);
                                                return {
                                                    ...p,
                                                    category_id: e.target.value,
                                                    category: picked ? picked.slug : p.category,
                                                };
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    >
                                        <option value="">— Legacy free-text category —</option>
                                        {categories
                                            .filter((c) => !c.parent_id)
                                            .map((root) => (
                                                <optgroup key={root.id} label={root.name}>
                                                    <option value={root.id}>{root.name} (all)</option>
                                                    {categories
                                                        .filter((c) => c.parent_id === root.id)
                                                        .map((child) => (
                                                            <option key={child.id} value={child.id}>
                                                                — {child.name}
                                                            </option>
                                                        ))}
                                                </optgroup>
                                            ))}
                                    </select>
                                    {!editor.category_id && (
                                        <input
                                            value={editor.category}
                                            onChange={(e) => setEditor((p) => (p ? { ...p, category: e.target.value } : p))}
                                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                            placeholder="legacy category, e.g. building"
                                        />
                                    )}
                                    <span className="mt-1 block text-xs text-gray-400">
                                        Managed under the Categories tab - subcategories show as “— name”.
                                    </span>
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
                                <MediaUploadInput
                                    kind="image"
                                    value={editor.image_url}
                                    onChange={(url) => setEditor((p) => (p ? { ...p, image_url: url } : p))}
                                    folder="services"
                                    label="Service image"
                                    uploadTestId="service-image"
                                />
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
