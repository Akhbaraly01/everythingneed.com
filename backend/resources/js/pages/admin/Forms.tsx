import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ClipboardList, X, Globe, RefreshCw, FileText, ChevronUp, ChevronDown, Inbox } from 'lucide-react';
import { api, errorMessage, rows } from '@/lib/api';
import { useAuthPermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import ConfirmDialog, { EmptyState, StatusBadge, TableSkeleton } from '@/components/shared/Ui';

type FieldType =
    | 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date'
    | 'select' | 'multiselect' | 'checkbox' | 'radio'
    | 'file' | 'image' | 'address' | 'country' | 'currency';

const FIELD_TYPES: FieldType[] = [
    'text', 'textarea', 'number', 'email', 'phone', 'date',
    'select', 'multiselect', 'checkbox', 'radio',
    'file', 'image', 'address', 'country', 'currency',
];

const CHOICE_TYPES: FieldType[] = ['select', 'radio', 'multiselect'];
const LENGTH_TYPES: FieldType[] = ['text', 'textarea', 'address', 'country'];

interface FieldDef {
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
    visibility: 'public' | 'hidden';
    options: string;
    max: string;
}

interface FormRow {
    id: string;
    name: string;
    slug: string;
    status: 'draft' | 'published';
    fields_count: number;
    submissions_count: number;
}

interface FormDetail extends FormRow {
    fields: Array<{
        key: string;
        label: string;
        type: FieldType;
        required?: boolean;
        visibility?: string;
        options?: string[];
        max?: number;
    }>;
}

interface SubmissionRow {
    id: string;
    data: Record<string, unknown>;
    status: string;
    user_id: string | null;
    created_at: string;
}

interface FormEditorState {
    id: string | null;
    name: string;
    slug: string;
    slugTouched: boolean;
    status: 'draft' | 'published';
    fields: FieldDef[];
}

const emptyField = (): FieldDef => ({
    key: '',
    label: '',
    type: 'text',
    required: true,
    visibility: 'public',
    options: '',
    max: '',
});

const emptyForm = (): FormEditorState => ({
    id: null,
    name: '',
    slug: '',
    slugTouched: false,
    status: 'draft',
    fields: [emptyField()],
});

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export default function AdminForms() {
    const { can } = useAuthPermissions();
    const canManage = can('forms.manage');

    const [forms, setForms] = useState<FormRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<FormEditorState | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<FormDetail | null>(null);
    const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);

    const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);
    const [confirmBusy, setConfirmBusy] = useState(false);

    const load = async () => {
        try {
            const res = await api.get<{ data: FormRow[] }>('/api/admin/forms');
            setForms(rows<FormRow>(res));
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to load forms'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const loadDetail = async (id: string) => {
        setSelectedId(id);
        setSubmissionsLoading(true);
        try {
            const [formRes, subsRes] = await Promise.all([
                api.get<{ data: FormDetail }>(`/api/admin/forms/${id}`),
                api.get<{ data: SubmissionRow[] }>(`/api/admin/forms/${id}/submissions`),
            ]);
            setDetail((formRes as { data: FormDetail }).data);
            setSubmissions(rows<SubmissionRow>(subsRes));
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to load form'));
            setSelectedId(null);
            setDetail(null);
            setSubmissions([]);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const refreshList = async () => {
        try {
            const res = await api.get<{ data: FormRow[] }>('/api/admin/forms');
            setForms(rows<FormRow>(res));
        } catch {
            /* list refresh is best-effort */
        }
    };

    const openCreate = () => {
        setFormError('');
        setForm(emptyForm());
    };

    const openEdit = async (row: FormRow) => {
        setFormError('');
        try {
            const res = await api.get<{ data: FormDetail }>(`/api/admin/forms/${row.id}`);
            const d = res.data;
            setForm({
                id: d.id,
                name: d.name,
                slug: d.slug,
                slugTouched: true,
                status: d.status,
                fields:
                    Array.isArray(d.fields) && d.fields.length > 0
                        ? d.fields.map((f) => ({
                              key: f.key,
                              label: f.label,
                              type: f.type,
                              required: Boolean(f.required),
                              visibility: f.visibility === 'hidden' ? 'hidden' : 'public',
                              options: (f.options ?? []).join(', '),
                              max: f.max === undefined || f.max === null ? '' : String(f.max),
                          }))
                        : [emptyField()],
            });
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to load form'));
        }
    };

    const validateForm = (): string | null => {
        if (!form) return 'No form';
        if (!form.name.trim()) return 'Name is required.';
        if (!/^[a-z0-9_-]+$/.test(form.slug)) return 'Slug may only contain lowercase letters, numbers, dashes and underscores.';
        if (form.fields.length === 0) return 'Define at least one field.';
        const seen = new Set<string>();
        for (const f of form.fields) {
            if (!/^[a-z][a-z0-9_]*$/.test(f.key)) return `Field key "${f.key || '?'}" must be lowercase snake_case (a-z, 0-9, _).`;
            if (!f.label.trim()) return `Field "${f.key}" needs a label.`;
            if (seen.has(f.key)) return `Duplicate field key "${f.key}".`;
            if (CHOICE_TYPES.includes(f.type) && f.options.split(',').map((o) => o.trim()).filter(Boolean).length === 0) {
                return `Field "${f.key}" needs at least one option.`;
            }
            if (f.max !== '' && (!/^\d+$/.test(f.max) || Number(f.max) < 1)) {
                return `Field "${f.key}" has an invalid max value.`;
            }
            seen.add(f.key);
        }
        return null;
    };

    const buildFields = (editor: FormEditorState) =>
        editor.fields.map((f, index) => ({
            key: f.key,
            label: f.label.trim(),
            type: f.type,
            required: f.required,
            visibility: f.visibility,
            ordering: index,
            ...(CHOICE_TYPES.includes(f.type)
                ? { options: f.options.split(',').map((o) => o.trim()).filter(Boolean) }
                : {}),
            ...(f.max !== '' ? { max: Number(f.max) } : {}),
        }));

    const saveForm = async () => {
        const error = validateForm();
        if (error) {
            setFormError(error);
            return;
        }
        if (!form) return;
        setSaving(true);
        setFormError('');
        const payload = {
            name: form.name.trim(),
            slug: form.slug,
            status: form.status,
            fields: buildFields(form),
        };
        try {
            if (form.id) {
                await api.put(`/api/admin/forms/${form.id}`, payload);
                toast.success('Form updated.');
            } else {
                const res = await api.post<{ data: FormRow }>('/api/admin/forms', payload);
                toast.success('Form created.');
                const created = res.data;
                setForm(null);
                await refreshList();
                if (created?.id) await loadDetail(created.id);
                return;
            }
            setForm(null);
            await refreshList();
            if (selectedId) await loadDetail(selectedId);
        } catch (e) {
            setFormError(errorMessage(e, 'Could not save form'));
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (row: FormRow) => {
        const next = row.status === 'published' ? 'draft' : 'published';
        try {
            await api.put(`/api/admin/forms/${row.id}`, { status: next });
            toast.success(`${row.name} is now ${next}.`);
            await refreshList();
            if (selectedId === row.id && detail) setDetail({ ...detail, status: next });
        } catch (e) {
            toast.error(errorMessage(e, 'Could not change status'));
        }
    };

    const deleteForm = async () => {
        if (!confirm) return;
        setConfirmBusy(true);
        try {
            await api.del(`/api/admin/forms/${confirm.id}`);
            toast.success('Form deleted.');
            if (selectedId === confirm.id) {
                setSelectedId(null);
                setDetail(null);
                setSubmissions([]);
            }
            setConfirm(null);
            await refreshList();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete form'));
        } finally {
            setConfirmBusy(false);
        }
    };

    const setField = (index: number, patch: Partial<FieldDef>) => {
        setForm((prev) =>
            prev
                ? { ...prev, fields: prev.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)) }
                : prev,
        );
    };

    const moveField = (index: number, direction: -1 | 1) => {
        setForm((prev) => {
            if (!prev) return prev;
            const target = index + direction;
            if (target < 0 || target >= prev.fields.length) return prev;
            const next = [...prev.fields];
            [next[index], next[target]] = [next[target], next[index]];
            return { ...prev, fields: next };
        });
    };

    return (
        <AdminLayout title="Forms">
            <Head title="Admin Forms" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dynamic Forms</h1>
                        <p className="text-sm text-gray-500">
                            Build no-code forms from controlled field types; server validation is generated from your schema.
                        </p>
                    </div>
                    {canManage && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            <Plus className="h-4 w-4" /> New Form
                        </button>
                    )}
                </div>

                {loading ? (
                    <TableSkeleton rows={4} cols={6} />
                ) : forms.length === 0 ? (
                    <EmptyState
                        icon={<ClipboardList className="h-10 w-10" />}
                        title="No forms yet"
                        description="Create your first form (contact, application, survey...) and publish it to start collecting submissions."
                        action={
                            canManage ? (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                >
                                    New Form
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
                                    <th className="px-4 py-3">Slug</th>
                                    <th className="px-4 py-3">Fields</th>
                                    <th className="px-4 py-3">Submissions</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {forms.map((row) => (
                                    <tr key={row.id} className={selectedId === row.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.slug}</td>
                                        <td className="px-4 py-3 text-gray-500">{row.fields_count}</td>
                                        <td className="px-4 py-3 text-gray-500">{row.submissions_count}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={row.status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                {canManage && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => void toggleStatus(row)}
                                                            title={row.status === 'published' ? 'Unpublish' : 'Publish'}
                                                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                        >
                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void openEdit(row)}
                                                            title="Edit form"
                                                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => void loadDetail(row.id)}
                                                    title="View submissions"
                                                    className={`rounded-lg border px-2.5 py-1.5 text-xs dark:hover:bg-gray-700 ${
                                                        selectedId === row.id
                                                            ? 'border-indigo-400 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <Inbox className="h-3.5 w-3.5" />
                                                </button>
                                                {canManage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirm({ id: row.id, name: row.name })}
                                                        title="Delete form"
                                                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
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

                {selectedId && detail && (
                    <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <FileText className="h-4 w-4" /> {detail.name}
                                    <StatusBadge status={detail.status} />
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Fields: {(detail.fields ?? []).map((f) => f.label).join(', ') || '—'}
                                    {detail.status === 'published' && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                                            <Globe className="h-3 w-3" /> public:{' '}
                                            <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">/forms/{detail.slug}</code>
                                        </span>
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedId(null)}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                            >
                                Close
                            </button>
                        </div>

                        {submissionsLoading ? (
                            <TableSkeleton rows={3} cols={3} />
                        ) : submissions.length === 0 ? (
                            <EmptyState
                                icon={<Inbox className="h-8 w-8" />}
                                title="No submissions yet"
                                description="Responses will appear here once the published form is submitted."
                            />
                        ) : (
                            <div className="space-y-3">
                                {submissions.map((sub) => (
                                    <div key={sub.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                                            <span>{new Date(sub.created_at).toLocaleString()}</span>
                                            <StatusBadge status={sub.status} />
                                        </div>
                                        <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                                            {(detail.fields ?? []).map((f) => (
                                                <div key={f.key} className="flex gap-2 text-sm">
                                                    <dt className="shrink-0 text-gray-500">{f.label}:</dt>
                                                    <dd className="text-gray-800 dark:text-gray-200">
                                                        {sub.data?.[f.key] === undefined || sub.data?.[f.key] === null
                                                            ? '—'
                                                            : typeof sub.data[f.key] === 'boolean'
                                                              ? sub.data[f.key]
                                                                  ? 'Yes'
                                                                  : 'No'
                                                              : Array.isArray(sub.data[f.key])
                                                                ? (sub.data[f.key] as unknown[]).join(', ')
                                                                : String(sub.data[f.key])}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {form && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setForm(null)} />
                    <div className="relative z-10 w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {form.id ? 'Edit Form' : 'New Form'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setForm(null)}
                                disabled={saving}
                                aria-label="Close"
                                className="rounded p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Name *</span>
                                <input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((p) =>
                                            p
                                                ? {
                                                      ...p,
                                                      name: e.target.value,
                                                      slug: p.slugTouched ? p.slug : slugify(e.target.value),
                                                  }
                                                : p,
                                        )
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    placeholder="Contact us"
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Slug *</span>
                                <input
                                    value={form.slug}
                                    onChange={(e) =>
                                        setForm((p) => (p ? { ...p, slug: e.target.value.toLowerCase(), slugTouched: true } : p))
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    placeholder="contact-us"
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Status</span>
                                <select
                                    value={form.status}
                                    onChange={(e) =>
                                        setForm((p) => (p ? { ...p, status: e.target.value as 'draft' | 'published' } : p))
                                    }
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </label>
                        </div>

                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Fields *</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm((p) => (p ? { ...p, fields: [...p.fields, emptyField()] } : p))
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add field
                                </button>
                            </div>
                            <div className="space-y-2">
                                {form.fields.map((field, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex flex-col gap-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => moveField(index, -1)}
                                                    disabled={index === 0}
                                                    title="Move up"
                                                    className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                >
                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveField(index, 1)}
                                                    disabled={index === form.fields.length - 1}
                                                    title="Move down"
                                                    className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <input
                                                value={field.key}
                                                onChange={(e) => setField(index, { key: e.target.value.toLowerCase() })}
                                                placeholder="key"
                                                className="w-32 rounded border border-gray-300 px-2 py-1 font-mono text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                            />
                                            <input
                                                value={field.label}
                                                onChange={(e) => setField(index, { label: e.target.value })}
                                                placeholder="Label"
                                                className="w-44 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                            />
                                            <select
                                                value={field.type}
                                                onChange={(e) => setField(index, { type: e.target.value as FieldType })}
                                                className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                            >
                                                {FIELD_TYPES.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={field.visibility}
                                                onChange={(e) =>
                                                    setField(index, { visibility: e.target.value as 'public' | 'hidden' })
                                                }
                                                className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                            >
                                                <option value="public">visible</option>
                                                <option value="hidden">hidden</option>
                                            </select>
                                            <label className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={(e) => setField(index, { required: e.target.checked })}
                                                />
                                                required
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setForm((p) =>
                                                        p ? { ...p, fields: p.fields.filter((_, i) => i !== index) } : p,
                                                    )
                                                }
                                                disabled={form.fields.length <= 1}
                                                title="Remove field"
                                                className="ml-auto rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-3 pl-6">
                                            {CHOICE_TYPES.includes(field.type) && (
                                                <label className="flex flex-1 items-center gap-2 text-xs text-gray-500">
                                                    Options (comma separated)
                                                    <input
                                                        value={field.options}
                                                        onChange={(e) => setField(index, { options: e.target.value })}
                                                        placeholder="option one, option two"
                                                        className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                                    />
                                                </label>
                                            )}
                                            {(LENGTH_TYPES.includes(field.type) || field.type === 'number' || field.type === 'currency') && (
                                                <label className="flex items-center gap-2 text-xs text-gray-500">
                                                    Max
                                                    <input
                                                        value={field.max}
                                                        onChange={(e) => setField(index, { max: e.target.value })}
                                                        placeholder="e.g. 255"
                                                        className="w-24 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setForm(null)}
                                disabled={saving}
                                className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void saveForm()}
                                disabled={saving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                            >
                                {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create form'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirm !== null}
                title="Delete form?"
                description={confirm ? `"${confirm.name}" and all of its submissions will be permanently removed.` : ''}
                confirmLabel="Delete"
                danger
                busy={confirmBusy}
                onConfirm={() => void deleteForm()}
                onCancel={() => setConfirm(null)}
            />
        </AdminLayout>
    );
}
