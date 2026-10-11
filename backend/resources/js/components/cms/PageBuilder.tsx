import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, errorMessage, ApiError } from '@/lib/api';
import ConfirmDialog from '@/components/shared/Ui';
import {
    ArrowDown, ArrowUp, Eye, EyeOff, History, LayoutGrid, Loader2,
    Pencil, Plus, Save, Trash2, X, Image as ImageIcon, ExternalLink, CheckCircle2,
} from 'lucide-react';
import Image from '@/components/shared/Image';

/**
 * No-code page builder (spec S41/S42/S45): add/reorder/edit/preview the
 * closed block set, save with a revision note, and restore history.
 * All forms are generated from the server registry - one schema drives
 * both validation and UI, so a new server field is instantly editable.
 */

export interface RegistryField {
    type: 'text' | 'textarea' | 'url' | 'image' | 'int' | 'bool' | 'select' | 'list';
    label: string;
    required?: boolean;
    max?: number;
    min?: number;
    options?: string[];
    default?: string | number | boolean;
    required_if?: [string, string];
    fields?: Record<string, RegistryField>;
}

export interface RegistryType {
    type: string;
    label: string;
    group: string;
    fields: Record<string, RegistryField>;
}

interface BuilderBlock {
    id: string;
    type: string;
    data: DataBag;
    is_visible: boolean;
}

type DataBag = Record<string, unknown>;

/** Shape returned by the blocks/revisions endpoints before local mapping. */
interface ServerBlock {
    id?: string;
    type: string;
    data?: DataBag;
    is_visible?: boolean;
}

interface PageSnapshot {
    page?: { title?: string; slug?: string };
    blocks?: { type?: string }[];
}

interface RevisionRow {
    version: number;
    note: string | null;
    blocks: number;
    status: string | null;
    author: string | null;
    created_at: string;
}

interface PageBuilderProps {
    page: { id: string; title: string; slug: string; status?: string };
    onClose: () => void;
    onSaved: () => void;
}

const newId = (): string =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === 'x' ? r : (r & 0x3) | 0x8;
              return v.toString(16);
          });

const defaultValue = (field: RegistryField): unknown => {
    if (field.default !== undefined) return field.default;
    switch (field.type) {
        case 'list':
            return [];
        case 'bool':
            return false;
        case 'int':
            return field.min ?? 0;
        default:
            return '';
    }
};

const blockPreview = (block: BuilderBlock): string => {
    const d = block.data ?? {};
    if (typeof d.title === 'string' && d.title) return d.title;
    if (typeof d.heading === 'string' && d.heading) return d.heading;
    if (typeof d.button_label === 'string' && d.button_label) return d.button_label;
    if (Array.isArray(d.items) && d.items.length > 0) return d.items[0]?.title ?? `${d.items.length} items`;
    if (Array.isArray(d.images) && d.images.length > 0) return `${d.images.length} images`;
    if (typeof d.body === 'string' && d.body) return d.body.slice(0, 60);
    return '';
};

function FieldInput({
    field,
    value,
    onChange,
    onUpload,
    uploading,
}: {
    field: RegistryField;
    value: unknown;
    onChange: (value: unknown) => void;
    onUpload?: (file: File) => void;
    uploading?: boolean;
}) {
    const base = 'w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900';

    if (field.type === 'list') {
        const rows: DataBag[] = Array.isArray(value) ? (value as DataBag[]) : [];
        const sub = field.fields ?? {};
        const canAdd = rows.length < (field.max ?? 20);
        const canRemove = rows.length > (field.min ?? 0);
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {field.label}
                        {field.required ? <span className="text-red-500"> *</span> : null}
                    </span>
                    <button
                        type="button"
                        disabled={!canAdd}
                        onClick={() => onChange([...rows, Object.fromEntries(Object.entries(sub).map(([k, f]) => [k, defaultValue(f)]))])}
                        className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2 py-1 text-xs text-white disabled:opacity-40"
                    >
                        <Plus className="h-3 w-3" /> Add
                    </button>
                </div>
                {rows.length === 0 && (
                    <p className="rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 dark:border-gray-600">
                        No items yet.
                    </p>
                )}
                {rows.map((row, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">#{i + 1}</span>
                            <button
                                type="button"
                                disabled={!canRemove}
                                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                                className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-900/20"
                                aria-label={`Remove item ${i + 1}`}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="grid gap-2">
                            {Object.entries(sub).map(([subKey, subField]) => (
                                <FieldInput
                                    key={subKey}
                                    field={subField}
                                    value={row?.[subKey] ?? ''}
                                    onChange={(v) => onChange(rows.map((r, j) => (j === i ? { ...r, [subKey]: v } : r)))}
                                    onUpload={onUpload}
                                    uploading={uploading}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (field.type === 'bool') {
        return (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
                {field.label}
            </label>
        );
    }

    if (field.type === 'select') {
        return (
            <label className="block space-y-1">
                <span className="text-xs font-medium text-gray-500">
                    {field.label}
                    {field.required || field.required_if ? <span className="text-red-500"> *</span> : null}
                </span>
                <select aria-label={field.label} className={base} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
                    <option value="">—</option>
                    {(field.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </label>
        );
    }

    if (field.type === 'int') {
        return (
            <label className="block space-y-1">
                <span className="text-xs font-medium text-gray-500">
                    {field.label}
                    {field.required || field.required_if ? <span className="text-red-500"> *</span> : null}
                </span>
                <input
                    aria-label={field.label}
                    type="number"
                    min={field.min}
                    max={field.max}
                    className={base}
                    value={Number(value ?? 0)}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            </label>
        );
    }

    if (field.type === 'image') {
        return (
            <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500">
                    {field.label}
                    {field.required ? <span className="text-red-500"> *</span> : null}
                </span>
                <div className="flex items-center gap-2">
                    <input
                        aria-label={field.label}
                        className={base}
                        placeholder="/storage/... or https://..."
                        value={String(value ?? '')}
                        onChange={(e) => onChange(e.target.value)}
                    />
                    <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border border-gray-300 px-2 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f && onUpload) onUpload(f);
                                e.target.value = '';
                            }}
                        />
                    </label>
                </div>
                {value ? (
                    <Image src={String(value)} alt="" className="h-14 w-24 rounded border border-gray-200 object-cover dark:border-gray-700" />
                ) : null}
            </div>
        );
    }

    if (field.type === 'textarea') {
        return (
            <label className="block space-y-1">
                <span className="text-xs font-medium text-gray-500">
                    {field.label}
                    {field.required ? <span className="text-red-500"> *</span> : null}
                </span>
                <textarea
                    aria-label={field.label}
                    rows={4}
                    maxLength={field.max}
                    className={base}
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                />
            </label>
        );
    }

    return (
        <label className="block space-y-1">
            <span className="text-xs font-medium text-gray-500">
                {field.label}
                {field.required || field.required_if ? <span className="text-red-500"> *</span> : null}
            </span>
            <input
                aria-label={field.label}
                className={base}
                maxLength={field.max}
                placeholder={field.type === 'url' ? '/products, https://... or #anchor' : undefined}
                value={String(value ?? '')}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}

export default function PageBuilder({ page, onClose, onSaved }: PageBuilderProps) {
    const [registry, setRegistry] = useState<RegistryType[]>([]);
    const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string[]>([]);
    const [notice, setNotice] = useState<string | null>(null);
    const [dirty, setDirty] = useState(false);
    const [note, setNote] = useState('');
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [showRevisions, setShowRevisions] = useState(false);
    const [revisions, setRevisions] = useState<RevisionRow[]>([]);
    const [viewRevision, setViewRevision] = useState<{ version: number; snapshot: PageSnapshot } | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<RevisionRow | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [uploading, setUploading] = useState(false);

    const byType = useMemo(() => Object.fromEntries(registry.map((r) => [r.type, r])), [registry]);
    const groups = useMemo(() => {
        const map = new Map<string, RegistryType[]>();
        registry.forEach((r) => {
            const list = map.get(r.group) ?? [];
            list.push(r);
            map.set(r.group, list);
        });
        return Array.from(map.entries());
    }, [registry]);

    const applyServerBlocks = (rows: ServerBlock[]) =>
        rows.map((b) => ({
            id: b.id ?? newId(),
            type: b.type,
            data: b.data ?? {},
            is_visible: b.is_visible ?? true,
        }));

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError([]);
        try {
            const [reg, cur] = await Promise.all([
                api.get<{ data: RegistryType[] }>('/api/admin/cms/blocks/registry'),
                api.get<{ data: ServerBlock[] }>(`/api/admin/cms/pages/${page.id}/blocks`),
            ]);
            setRegistry(reg.data ?? []);
            setBlocks(applyServerBlocks(cur.data ?? []));
        } catch (e) {
            setError([errorMessage(e, 'Failed to load the builder')]);
        } finally {
            setLoading(false);
        }
    }, [page.id]);

    const loadRevisions = useCallback(async () => {
        try {
            const res = await api.get<{ data: RevisionRow[] }>(`/api/admin/cms/pages/${page.id}/revisions`);
            setRevisions(res.data ?? []);
        } catch {
            setRevisions([]);
        }
    }, [page.id]);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    const updateBlocks = (next: BuilderBlock[]) => {
        setBlocks(next);
        setDirty(true);
        setNotice(null);
    };

    const addBlock = (type: string) => {
        const def = byType[type];
        if (!def) return;
        const data: DataBag = {};
        Object.entries(def.fields).forEach(([key, field]) => {
            data[key] = defaultValue(field);
        });
        updateBlocks([...blocks, { id: newId(), type, data, is_visible: true }]);
        setShowAdd(false);
        setEditIndex(blocks.length);
    };

    const move = (index: number, dir: -1 | 1) => {
        const target = index + dir;
        if (target < 0 || target >= blocks.length) return;
        const next = [...blocks];
        [next[index], next[target]] = [next[target], next[index]];
        updateBlocks(next);
    };

    const remove = (index: number) => {
        updateBlocks(blocks.filter((_, i) => i !== index));
        if (editIndex === index) setEditIndex(null);
        else if (editIndex !== null && editIndex > index) setEditIndex(editIndex - 1);
    };

    const toggleVisible = (index: number) => {
        updateBlocks(blocks.map((b, i) => (i === index ? { ...b, is_visible: !b.is_visible } : b)));
    };

    const uploadImage = async (targetIndex: number, fieldKey: string, file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            setError(['Image must be 10MB or smaller']);
            return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await api.post<{ data: { url: string } }>('/api/upload', fd);
            const url = res.data.url;
            setBlocks((prev) =>
                prev.map((b, i) =>
                    i === targetIndex
                        ? { ...b, data: Array.isArray(b.data[fieldKey]) ? b.data : { ...b.data, [fieldKey]: url } }
                        : b,
                ),
            );
            setDirty(true);
            setError([]);
        } catch (e) {
            setError([errorMessage(e, 'Upload failed')]);
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        setSaving(true);
        setError([]);
        try {
            const res = await api.put<{ data: { revision: { version: number }; blocks: ServerBlock[] } }>(
                `/api/admin/cms/pages/${page.id}/blocks`,
                {
                    blocks: blocks.map((b) => ({ id: b.id, type: b.type, data: b.data, is_visible: b.is_visible })),
                    note: note.trim() || null,
                },
            );
            setDirty(false);
            setNote('');
            setNotice(`Saved as revision v${res.data.revision.version}`);
            setBlocks(applyServerBlocks(res.data.blocks));
            void loadRevisions();
            onSaved();
        } catch (e) {
            const errs: string[] = [];
            const fields = e instanceof ApiError ? e.errors : undefined;
            if (fields) {
                Object.entries(fields).forEach(([key, messages]) => {
                    messages.forEach((m) =>
                        errs.push(`${key.replace(/^blocks\./, 'Block ').replace(/\.data\./, ': ')} — ${m}`),
                    );
                });
            }
            setError(errs.length > 0 ? errs : [errorMessage(e, 'Save failed')]);
        } finally {
            setSaving(false);
        }
    };

    const restore = async () => {
        if (!restoreTarget) return;
        setRestoring(true);
        setError([]);
        try {
            const res = await api.post<{ data: { blocks: ServerBlock[]; revision: { version: number } } }>(
                `/api/admin/cms/pages/${page.id}/revisions/${restoreTarget.version}/restore`,
            );
            setBlocks(applyServerBlocks(res.data.blocks));
            setNotice(`Restored from v${restoreTarget.version} as revision v${res.data.revision.version}`);
            setDirty(false);
            setRestoreTarget(null);
            setViewRevision(null);
            void loadRevisions();
            onSaved();
        } catch (e) {
            setError([errorMessage(e, 'Restore failed')]);
        } finally {
            setRestoring(false);
        }
    };

    const viewSnapshot = async (version: number) => {
        try {
            const res = await api.get<{ data: { version: number; snapshot: PageSnapshot } }>(
                `/api/admin/cms/pages/${page.id}/revisions/${version}`,
            );
            setViewRevision(res.data);
        } catch (e) {
            setError([errorMessage(e, 'Failed to load revision')]);
        }
    };

    const editing = editIndex !== null ? blocks[editIndex] : null;
    const editingDef = editing ? byType[editing.type] : null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="dialog" aria-modal="true" aria-label={`Page builder for ${page.title}`}>
            <div className="relative flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5 text-indigo-600" />
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{page.title}</p>
                            <a
                                href={`/p/${page.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                            >
                                /p/{page.slug} <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowRevisions(!showRevisions);
                                if (!showRevisions) void loadRevisions();
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
                        >
                            <History className="h-3.5 w-3.5" /> Revisions
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close builder"
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {error.length > 0 && (
                    <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        {error.map((e, i) => (
                            <p key={i}>{e}</p>
                        ))}
                    </div>
                )}
                {notice && (
                    <div className="flex items-center gap-2 border-b border-green-200 bg-green-50 px-5 py-2 text-xs text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {notice}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {showRevisions ? (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Revision history</p>
                            {revisions.length === 0 && <p className="text-sm text-gray-500">No revisions yet.</p>}
                            {revisions.map((r) => (
                                <div key={r.version} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                v{r.version}
                                                <span className="ml-2 text-xs font-normal text-gray-500">
                                                    {r.blocks} block{r.blocks === 1 ? '' : 's'} · {r.status ?? '—'} · {r.author ?? 'system'}
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {r.note ?? '—'} · {new Date(r.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void viewSnapshot(r.version)}
                                                className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                            >
                                                View
                                            </button>
                                            <button type="button" onClick={() => setRestoreTarget(r)} className="rounded bg-indigo-600 px-2 py-1 text-xs text-white">
                                                Restore
                                            </button>
                                        </div>
                                    </div>
                                    {viewRevision?.version === r.version && (
                                        <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                            <p>
                                                Title: {viewRevision.snapshot?.page?.title ?? '—'} · Slug: {viewRevision.snapshot?.page?.slug ?? '—'}
                                            </p>
                                            <p className="mt-1">
                                                Blocks: {(viewRevision.snapshot?.blocks ?? []).map((b) => b.type ?? '').join(' → ') || 'none'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : loading ? (
                        <p className="text-sm text-gray-500">Loading builder…</p>
                    ) : (
                        <div className="space-y-2">
                            {blocks.length === 0 && (
                                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700">
                                    No blocks yet. Add your first block below.
                                </div>
                            )}
                            {blocks.map((block, i) => (
                                <div
                                    key={block.id}
                                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                                        block.is_visible
                                            ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                            : 'border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800/50'
                                    }`}
                                >
                                    <LayoutGrid className="h-4 w-4 shrink-0 text-gray-400" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                            {i + 1}. {byType[block.type]?.label ?? block.type}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">{blockPreview(block) || 'No content'}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => move(i, -1)}
                                            disabled={i === 0}
                                            className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                                            aria-label="Move up"
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => move(i, 1)}
                                            disabled={i === blocks.length - 1}
                                            className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                                            aria-label="Move down"
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleVisible(i)}
                                            className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            aria-label={block.is_visible ? 'Hide block' : 'Show block'}
                                        >
                                            {block.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditIndex(i)}
                                            className="rounded p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                            aria-label="Edit block"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => remove(i)}
                                            className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            aria-label="Delete block"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {showAdd ? (
                                <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Add block</p>
                                        <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-gray-500 hover:underline">
                                            Close
                                        </button>
                                    </div>
                                    {groups.map(([group, types]) => (
                                        <div key={group} className="mb-3">
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{group}</p>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                {types.map((t) => (
                                                    <button
                                                        key={t.type}
                                                        type="button"
                                                        onClick={() => addBlock(t.type)}
                                                        className="rounded-lg border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-indigo-950"
                                                    >
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowAdd(true)}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700"
                                >
                                    <Plus className="h-4 w-4" /> Add block
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
                    <input
                        aria-label="Revision note"
                        className="flex-1 rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                        placeholder="Revision note (optional)"
                        value={note}
                        maxLength={255}
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => void save()}
                        disabled={saving || loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {dirty ? 'Save blocks' : 'Saved'}
                    </button>
                </div>

                {editing && editingDef && editIndex !== null && (
                    <div className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-gray-900">
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Edit {editingDef.label}</p>
                            <button
                                type="button"
                                onClick={() => setEditIndex(null)}
                                aria-label="Close editor"
                                className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            {Object.entries(editingDef.fields).map(([key, field]) => (
                                <FieldInput
                                    key={key}
                                    field={field}
                                    value={editing.data?.[key]}
                                    uploading={uploading}
                                    onChange={(v) => {
                                        setBlocks((prev) =>
                                            prev.map((b, i) => (i === editIndex ? { ...b, data: { ...b.data, [key]: v } } : b)),
                                        );
                                        setDirty(true);
                                        setNotice(null);
                                    }}
                                    onUpload={(file) => void uploadImage(editIndex, key, file)}
                                />
                            ))}
                        </div>
                        <div className="flex justify-end border-t border-gray-200 px-5 py-3 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setEditIndex(null)}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={restoreTarget !== null}
                title={`Restore revision v${restoreTarget?.version ?? ''}?`}
                description="Restoring writes the snapshot forward as a new revision — history is preserved."
                confirmLabel="Restore"
                busy={restoring}
                onConfirm={() => void restore()}
                onCancel={() => setRestoreTarget(null)}
            />
        </div>
    );
}
