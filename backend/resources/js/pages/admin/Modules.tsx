import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Rows3, X, Globe, RefreshCw, FileText } from 'lucide-react';
import { api, errorMessage, rows } from '@/lib/api';
import { useAuthPermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import ConfirmDialog, { EmptyState, StatusBadge, TableSkeleton } from '@/components/shared/Ui';

type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'url' | 'image';

const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'number', 'boolean', 'date', 'url', 'image'];

interface FieldDef {
    key: string;
    label: string;
    type: FieldType;
    required: boolean;
}

interface ModuleRow {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    status: 'draft' | 'published';
    entries_count: number;
}

interface ModuleDetail extends ModuleRow {
    fields: FieldDef[];
    list_config?: { columns?: string[] } | null;
    requires_approval?: boolean;
}

interface EntryRow {
    id: string;
    module_id: string;
    slug: string | null;
    status: string;
    data: Record<string, unknown>;
}

interface ModuleFormState {
    id: string | null;
    name: string;
    slug: string;
    slugTouched: boolean;
    icon: string;
    status: 'draft' | 'published';
    fields: FieldDef[];
}

interface EntryFormState {
    id: string | null;
    slug: string;
    status: 'draft' | 'published';
    data: Record<string, string>;
}

const emptyModuleForm = (): ModuleFormState => ({
    id: null,
    name: '',
    slug: '',
    slugTouched: false,
    icon: 'Boxes',
    status: 'draft',
    fields: [{ key: '', label: '', type: 'text', required: true }],
});

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

/**
 * W3 no-code dynamic modules console: schema-declared entities with
 * validated entries. Previously API-only (GET/POST/PUT/DELETE
 * /api/admin/modules*) - this page exposes schema CRUD, publish toggling
 * and per-module entry management end to end. Published modules are
 * readable publicly via /api/modules/{slug}.
 */
export default function AdminModules() {
    const { can } = useAuthPermissions();
    const canManage = can('modules.manage');

    const [modules, setModules] = useState<ModuleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<ModuleFormState | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<ModuleDetail | null>(null);
    const [entries, setEntries] = useState<EntryRow[]>([]);
    const [entriesLoading, setEntriesLoading] = useState(false);

    const [entryForm, setEntryForm] = useState<EntryFormState | null>(null);
    const [entryError, setEntryError] = useState('');

    const [confirm, setConfirm] = useState<{ kind: 'module' | 'entry'; id: string; name: string } | null>(null);
    const [confirmBusy, setConfirmBusy] = useState(false);

    const load = async () => {
        try {
            const res = await api.get<{ data: ModuleRow[] }>('/api/admin/modules');
            setModules(rows<ModuleRow>(res));
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to load modules'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const loadDetail = async (id: string) => {
        setSelectedId(id);
        setEntriesLoading(true);
        try {
            const [mod, list] = await Promise.all([
                api.get<{ data: ModuleDetail }>(`/api/admin/modules/${id}`),
                api.get<{ data: EntryRow[] }>(`/api/admin/modules/${id}/entries`),
            ]);
            setDetail((mod as { data: ModuleDetail }).data);
            setEntries(rows<EntryRow>(list));
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to load module'));
            setSelectedId(null);
            setDetail(null);
            setEntries([]);
        } finally {
            setEntriesLoading(false);
        }
    };

    const refreshList = async () => {
        try {
            const res = await api.get<{ data: ModuleRow[] }>('/api/admin/modules');
            setModules(rows<ModuleRow>(res));
        } catch {
            /* list refresh is best-effort */
        }
    };

    // ---------- module form ----------

    const openCreate = () => {
        setFormError('');
        setForm(emptyModuleForm());
    };

    const openEdit = async (row: ModuleRow) => {
        setFormError('');
        try {
            const res = await api.get<{ data: ModuleDetail }>(`/api/admin/modules/${row.id}`);
            const d = res.data;
            setForm({
                id: d.id,
                name: d.name,
                slug: d.slug,
                slugTouched: true,
                icon: d.icon ?? 'Boxes',
                status: d.status,
                fields:
                    Array.isArray(d.fields) && d.fields.length > 0
                        ? d.fields.map((f) => ({
                              key: f.key,
                              label: f.label,
                              type: f.type,
                              required: Boolean(f.required),
                          }))
                        : [{ key: '', label: '', type: 'text', required: true }],
            });
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to load module'));
        }
    };

    const validateModuleForm = (): string | null => {
        if (!form) return 'No form';
        if (!form.name.trim()) return 'Name is required.';
        if (!/^[a-z0-9_-]+$/.test(form.slug)) return 'Slug may only contain lowercase letters, numbers, dashes and underscores.';
        if (form.fields.length === 0) return 'Define at least one field.';
        const seen = new Set<string>();
        for (const f of form.fields) {
            if (!/^[a-z][a-z0-9_]*$/.test(f.key)) return `Field key "${f.key || '?'}" must be lowercase snake_case (a-z, 0-9, _).`;
            if (!f.label.trim()) return `Field "${f.key}" needs a label.`;
            if (seen.has(f.key)) return `Duplicate field key "${f.key}".`;
            seen.add(f.key);
        }
        return null;
    };

    const saveModule = async () => {
        const error = validateModuleForm();
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
            icon: form.icon.trim() || null,
            status: form.status,
            fields: form.fields.map((f) => ({
                key: f.key,
                label: f.label.trim(),
                type: f.type,
                required: f.required,
            })),
        };
        try {
            if (form.id) {
                await api.put(`/api/admin/modules/${form.id}`, payload);
                toast.success('Module updated.');
            } else {
                const res = await api.post<{ data: ModuleRow }>('/api/admin/modules', payload);
                toast.success('Module created.');
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
            setFormError(errorMessage(e, 'Could not save module'));
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (row: ModuleRow) => {
        const next = row.status === 'published' ? 'draft' : 'published';
        try {
            await api.put(`/api/admin/modules/${row.id}`, { status: next });
            toast.success(`${row.name} is now ${next}.`);
            await refreshList();
            if (selectedId === row.id && detail) setDetail({ ...detail, status: next });
        } catch (e) {
            toast.error(errorMessage(e, 'Could not change status'));
        }
    };

    const deleteModule = async () => {
        if (!confirm) return;
        setConfirmBusy(true);
        try {
            await api.del(`/api/admin/modules/${confirm.id}`);
            toast.success('Module deleted.');
            if (selectedId === confirm.id) {
                setSelectedId(null);
                setDetail(null);
                setEntries([]);
            }
            setConfirm(null);
            await refreshList();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete module'));
        } finally {
            setConfirmBusy(false);
        }
    };

    // ---------- entry form ----------

    const openEntryCreate = () => {
        setEntryError('');
        const data: Record<string, string> = {};
        detail?.fields?.forEach((f) => {
            data[f.key] = f.type === 'boolean' ? 'false' : '';
        });
        setEntryForm({ id: null, slug: '', status: 'draft', data });
    };

    const openEntryEdit = (entry: EntryRow) => {
        setEntryError('');
        const data: Record<string, string> = {};
        detail?.fields?.forEach((f) => {
            const value = entry.data?.[f.key];
            data[f.key] = value === undefined || value === null ? '' : String(value);
        });
        setEntryForm({
            id: entry.id,
            slug: entry.slug ?? '',
            status: entry.status === 'published' ? 'published' : 'draft',
            data,
        });
    };

    const saveEntry = async () => {
        if (!entryForm || !detail) return;
        setEntryError('');

        const payloadData: Record<string, unknown> = {};
        for (const f of detail.fields ?? []) {
            const raw = entryForm.data[f.key] ?? '';
            if (f.type === 'boolean') {
                payloadData[f.key] = raw === 'true' || raw === '1';
                continue;
            }
            if (typeof raw === 'string' && raw.trim() === '' && !f.required) {
                payloadData[f.key] = '';
                continue;
            }
            payloadData[f.key] = raw;
        }

        const payload = {
            slug: entryForm.slug.trim() || null,
            status: entryForm.status,
            data: payloadData,
        };

        setSaving(true);
        try {
            if (entryForm.id) {
                await api.put(`/api/admin/modules/${detail.id}/entries/${entryForm.id}`, payload);
                toast.success('Entry updated.');
            } else {
                await api.post(`/api/admin/modules/${detail.id}/entries`, payload);
                toast.success('Entry created.');
            }
            setEntryForm(null);
            await loadDetail(detail.id);
            await refreshList();
        } catch (e) {
            setEntryError(errorMessage(e, 'Could not save entry'));
        } finally {
            setSaving(false);
        }
    };

    const deleteEntry = async () => {
        if (!confirm || !detail) return;
        setConfirmBusy(true);
        try {
            await api.del(`/api/admin/modules/${detail.id}/entries/${confirm.id}`);
            toast.success('Entry deleted.');
            setConfirm(null);
            await loadDetail(detail.id);
            await refreshList();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete entry'));
        } finally {
            setConfirmBusy(false);
        }
    };

    const setField = (index: number, patch: Partial<FieldDef>) => {
        setForm((prev) =>
            prev
                ? {
                      ...prev,
                      fields: prev.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)),
                  }
                : prev,
        );
    };

    const fieldSummary = useMemo(() => {
        if (!detail) return '';
        return (detail.fields ?? []).map((f) => f.label).join(', ');
    }, [detail]);

    return (
        <AdminLayout title="Modules">
            <Head title="Admin Modules" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">No-Code Modules</h1>
                        <p className="text-sm text-gray-500">
                            Declare content schemas, manage entries and publish them to the storefront API.
                        </p>
                    </div>
                    {canManage && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            <Plus className="h-4 w-4" /> New Module
                        </button>
                    )}
                </div>

                {loading ? (
                    <TableSkeleton rows={4} cols={5} />
                ) : modules.length === 0 ? (
                    <EmptyState
                        icon={<Rows3 className="h-10 w-10" />}
                        title="No modules yet"
                        description="Create your first schema (FAQs, testimonials, link lists...) to start filling it with entries."
                        action={
                            canManage ? (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                >
                                    New Module
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
                                    <th className="px-4 py-3">Entries</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {modules.map((row) => (
                                    <tr key={row.id} className={selectedId === row.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.slug}</td>
                                        <td className="px-4 py-3 text-gray-500">{row.entries_count}</td>
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
                                                            title="Edit schema"
                                                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => void loadDetail(row.id)}
                                                    title="Manage entries"
                                                    className={`rounded-lg border px-2.5 py-1.5 text-xs dark:hover:bg-gray-700 ${
                                                        selectedId === row.id
                                                            ? 'border-indigo-400 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <Rows3 className="h-3.5 w-3.5" />
                                                </button>
                                                {canManage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirm({ kind: 'module', id: row.id, name: row.name })}
                                                        title="Delete module"
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

                {/* Entries management for the selected module */}
                {selectedId && detail && (
                    <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <FileText className="h-4 w-4" /> {detail.name}
                                    <StatusBadge status={detail.status} />
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Fields: {fieldSummary || '—'}
                                    {detail.status === 'published' && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                                            <Globe className="h-3 w-3" /> public:{' '}
                                            <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">/api/modules/{detail.slug}</code>
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedId(null)}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                                >
                                    Close
                                </button>
                                {canManage && (
                                    <button
                                        type="button"
                                        onClick={openEntryCreate}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                    >
                                        <Plus className="h-4 w-4" /> New Entry
                                    </button>
                                )}
                            </div>
                        </div>

                        {entriesLoading ? (
                            <TableSkeleton rows={3} cols={4} />
                        ) : entries.length === 0 ? (
                            <EmptyState
                                icon={<Rows3 className="h-8 w-8" />}
                                title="No entries yet"
                                description="Add the first row of data for this schema."
                            />
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-3 py-2">Slug</th>
                                            {(detail.fields ?? []).slice(0, 3).map((f) => (
                                                <th key={f.key} className="px-3 py-2">
                                                    {f.label}
                                                </th>
                                            ))}
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {entries.map((entry) => (
                                            <tr key={entry.id}>
                                                <td className="px-3 py-2 font-mono text-xs text-gray-500">{entry.slug ?? '—'}</td>
                                                {(detail.fields ?? []).slice(0, 3).map((f) => (
                                                    <td key={f.key} className="max-w-[18rem] truncate px-3 py-2 text-gray-700 dark:text-gray-300">
                                                        {entry.data?.[f.key] === undefined || entry.data?.[f.key] === null
                                                            ? '—'
                                                            : String(entry.data[f.key])}
                                                    </td>
                                                ))}
                                                <td className="px-3 py-2">
                                                    <StatusBadge status={entry.status} />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex justify-end gap-2">
                                                        {canManage && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEntryEdit(entry)}
                                                                    title="Edit entry"
                                                                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setConfirm({ kind: 'entry', id: entry.id, name: entry.slug ?? 'entry' })}
                                                                    title="Delete entry"
                                                                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-gray-600 dark:text-red-400"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {!canManage && <span className="text-xs text-gray-400">View only</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Module create/edit modal */}
            {form && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setForm(null)} />
                    <div className="relative z-10 w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {form.id ? 'Edit Module' : 'New Module'}
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

                        <div className="grid gap-4 sm:grid-cols-2">
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
                                    placeholder="Testimonials"
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
                                    placeholder="testimonials"
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Icon (lucide name)</span>
                                <input
                                    value={form.icon}
                                    onChange={(e) => setForm((p) => (p ? { ...p, icon: e.target.value } : p))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    placeholder="Boxes"
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
                                        setForm((p) =>
                                            p
                                                ? {
                                                      ...p,
                                                      fields: [
                                                          ...p.fields,
                                                          { key: '', label: '', type: 'text' as FieldType, required: false },
                                                      ],
                                                  }
                                                : p,
                                        )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add field
                                </button>
                            </div>
                            <div className="space-y-2">
                                {form.fields.map((field, index) => (
                                    <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
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
                                onClick={() => void saveModule()}
                                disabled={saving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                            >
                                {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create module'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Entry create/edit modal */}
            {entryForm && detail && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setEntryForm(null)} />
                    <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {entryForm.id ? 'Edit Entry' : `New ${detail.name} Entry`}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setEntryForm(null)}
                                disabled={saving}
                                aria-label="Close"
                                className="rounded p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Slug (optional)</span>
                                    <input
                                        value={entryForm.slug}
                                        onChange={(e) => setEntryForm((p) => (p ? { ...p, slug: e.target.value } : p))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="auto"
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Status</span>
                                    <select
                                        value={entryForm.status}
                                        onChange={(e) =>
                                            setEntryForm((p) =>
                                                p ? { ...p, status: e.target.value as 'draft' | 'published' } : p,
                                            )
                                        }
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </label>
                            </div>

                            {(detail.fields ?? []).map((f) => (
                                <label key={f.key} className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {f.label}
                                        {f.required ? ' *' : ''}
                                    </span>
                                    {f.type === 'boolean' ? (
                                        <select
                                            value={entryForm.data[f.key] ?? 'false'}
                                            onChange={(e) =>
                                                setEntryForm((p) =>
                                                    p ? { ...p, data: { ...p.data, [f.key]: e.target.value } } : p,
                                                )
                                            }
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        >
                                            <option value="false">No</option>
                                            <option value="true">Yes</option>
                                        </select>
                                    ) : f.type === 'textarea' ? (
                                        <textarea
                                            value={entryForm.data[f.key] ?? ''}
                                            onChange={(e) =>
                                                setEntryForm((p) =>
                                                    p ? { ...p, data: { ...p.data, [f.key]: e.target.value } } : p,
                                                )
                                            }
                                            rows={3}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    ) : (
                                        <input
                                            type={
                                                f.type === 'number'
                                                    ? 'number'
                                                    : f.type === 'date'
                                                      ? 'date'
                                                      : f.type === 'url' || f.type === 'image'
                                                        ? 'url'
                                                        : 'text'
                                            }
                                            value={entryForm.data[f.key] ?? ''}
                                            onChange={(e) =>
                                                setEntryForm((p) =>
                                                    p ? { ...p, data: { ...p.data, [f.key]: e.target.value } } : p,
                                                )
                                            }
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        />
                                    )}
                                </label>
                            ))}
                        </div>

                        {entryError && <p className="mt-3 text-sm text-red-600">{entryError}</p>}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEntryForm(null)}
                                disabled={saving}
                                className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void saveEntry()}
                                disabled={saving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                            >
                                {saving ? 'Saving…' : entryForm.id ? 'Save changes' : 'Create entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirm !== null}
                title={confirm?.kind === 'module' ? 'Delete module?' : 'Delete entry?'}
                description={
                    confirm
                        ? confirm.kind === 'module'
                            ? `"${confirm.name}" and all of its entries will be permanently removed.`
                            : `Entry "${confirm.name}" will be permanently removed.`
                        : ''
                }
                confirmLabel="Delete"
                danger
                busy={confirmBusy}
                onConfirm={() => void (confirm?.kind === 'module' ? deleteModule() : deleteEntry())}
                onCancel={() => setConfirm(null)}
            />
        </AdminLayout>
    );
}
