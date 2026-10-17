import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { api, errorMessage } from '@/lib/api';
import ConfirmDialog from '@/components/shared/Ui';
import MediaUploadInput from '@/components/shared/MediaUploadInput';
import { toast } from 'sonner';
import { FolderTree, Plus, Pencil, Trash2, Search, Globe } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parent_id: string | null;
    icon: string | null;
    image_url: string | null;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    sort_order: number;
    is_active: boolean;
}

interface Props {
    categories: Category[];
}

interface FormState {
    name: string;
    description: string;
    parent_id: string;
    icon: string;
    image_url: string;
    sort_order: string;
    is_active: boolean;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
}

const EMPTY_FORM: FormState = {
    name: '',
    description: '',
    parent_id: '',
    icon: '',
    image_url: '',
    sort_order: '0',
    is_active: true,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
};

export default function AdminCategories({ categories }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [busy, setBusy] = useState(false);
    const [query, setQuery] = useState('');
    const [deleteFor, setDeleteFor] = useState<Category | null>(null);

    const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

    /** id + every descendant (cycle guard: max depth 20). */
    const excludedParents = useMemo(() => {
        if (!editId) return new Set<string>();
        const out = new Set<string>([editId]);
        let frontier = [editId];
        for (let depth = 0; depth < 20 && frontier.length > 0; depth++) {
            const next: string[] = [];
            for (const c of categories) {
                if (c.parent_id && frontier.includes(c.parent_id) && !out.has(c.id)) {
                    out.add(c.id);
                    next.push(c.id);
                }
            }
            frontier = next;
        }
        return out;
    }, [categories, editId]);

    /** Tree order: roots first, children indented beneath. */
    const ordered = useMemo(() => {
        const roots = categories.filter((c) => !c.parent_id || !byId.has(c.parent_id));
        const walk = (parent: string | null, depth: number): { cat: Category; depth: number }[] =>
            categories
                .filter((c) => c.parent_id === parent)
                .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
                .flatMap((c) => [{ cat: c, depth }, ...walk(c.id, depth + 1)]);
        const seen = new Set<string>();
        const tree = walk(null, 0).filter((row) => !seen.has(row.cat.id) && seen.add(row.cat.id));
        const orphans = roots
            .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
            .filter((c) => !seen.has(c.id))
            .map((cat) => ({ cat, depth: 0 }));
        return [...tree, ...orphans];
    }, [categories, byId]);

    const filtered = ordered.filter(
        (row) =>
            !query.trim() ||
            row.cat.name.toLowerCase().includes(query.toLowerCase()) ||
            row.cat.slug.includes(query.toLowerCase()),
    );

    const set = (key: keyof FormState, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

    const reset = () => {
        setShowForm(false);
        setEditId(null);
        setForm(EMPTY_FORM);
    };

    const startEdit = (cat: Category) => {
        setEditId(cat.id);
        setForm({
            name: cat.name,
            description: cat.description ?? '',
            parent_id: cat.parent_id ?? '',
            icon: cat.icon ?? '',
            image_url: cat.image_url ?? '',
            sort_order: String(cat.sort_order ?? 0),
            is_active: cat.is_active,
            meta_title: cat.meta_title ?? '',
            meta_description: cat.meta_description ?? '',
            meta_keywords: cat.meta_keywords ?? '',
        });
        setShowForm(true);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const payload = {
                name: form.name,
                description: form.description || null,
                parent_id: form.parent_id || null,
                icon: form.icon || null,
                image_url: form.image_url || null,
                sort_order: Number(form.sort_order) || 0,
                is_active: form.is_active,
                meta_title: form.meta_title || null,
                meta_description: form.meta_description || null,
                meta_keywords: form.meta_keywords || null,
            };
            if (editId) {
                await api.put(`/api/categories/${editId}`, payload);
                toast.success('Category updated');
            } else {
                await api.post('/api/categories', payload);
                toast.success('Category created');
            }
            reset();
            router.reload({ only: ['categories'] as never });
        } catch (err) {
            toast.error(errorMessage(err, 'Failed'));
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id: string) => {
        try {
            await api.del(`/api/categories/${id}`);
            toast.success('Deleted');
            router.reload({ only: ['categories'] as never });
        } catch (err) {
            toast.error(errorMessage(err, 'Failed'));
        } finally {
            setDeleteFor(null);
        }
    };

    const field =
        'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white';
    const label = 'mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400';

    return (
        <AdminLayout title="Admin · Categories">
            <Head title="Categories" />
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                            <FolderTree className="h-6 w-6 text-purple-600" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
                            <p className="text-sm text-gray-500">
                                {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {categories.length > 0 && (
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search categories"
                                    className="rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        )}
                        <button
                            onClick={() => {
                                reset();
                                setShowForm(!showForm);
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" /> Add category
                        </button>
                    </div>
                </div>

                {showForm && (
                    <form
                        onSubmit={submit}
                        className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className={label} htmlFor="cat-name">Name *</label>
                                <input
                                    id="cat-name"
                                    value={form.name}
                                    onChange={(e) => set('name', e.target.value)}
                                    className={field}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className={label} htmlFor="cat-desc">Description</label>
                                <textarea
                                    id="cat-desc"
                                    value={form.description}
                                    onChange={(e) => set('description', e.target.value)}
                                    rows={2}
                                    maxLength={1000}
                                    className={field}
                                />
                            </div>
                            <div>
                                <label className={label} htmlFor="cat-parent">Parent category</label>
                                <select
                                    id="cat-parent"
                                    value={form.parent_id}
                                    onChange={(e) => set('parent_id', e.target.value)}
                                    className={field}
                                >
                                    <option value="">— Top level —</option>
                                    {categories
                                        .filter((c) => !excludedParents.has(c.id))
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className={label} htmlFor="cat-sort">Sort order</label>
                                <input
                                    id="cat-sort"
                                    type="number"
                                    min={0}
                                    value={form.sort_order}
                                    onChange={(e) => set('sort_order', e.target.value)}
                                    className={field}
                                />
                            </div>
                            <div>
                                <label className={label} htmlFor="cat-icon">Icon (lucide name)</label>
                                <input
                                    id="cat-icon"
                                    value={form.icon}
                                    onChange={(e) => set('icon', e.target.value)}
                                    placeholder="e.g. ShoppingBag"
                                    className={field}
                                />
                            </div>
                            <div>
                                <MediaUploadInput
                                    kind="image"
                                    value={form.image_url}
                                    onChange={(url) => set('image_url', url)}
                                    folder="categories"
                                    label="Category image"
                                    uploadTestId="category-image"
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <input
                                    id="cat-active"
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => set('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                />
                                <label htmlFor="cat-active" className="text-sm text-gray-700 dark:text-gray-300">
                                    Active (visible on the storefront)
                                </label>
                            </div>

                            <div className="sm:col-span-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    <Globe className="h-3.5 w-3.5" /> SEO
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className={label} htmlFor="cat-meta-title">Meta title</label>
                                        <input
                                            id="cat-meta-title"
                                            value={form.meta_title}
                                            onChange={(e) => set('meta_title', e.target.value)}
                                            maxLength={255}
                                            className={field}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={label} htmlFor="cat-meta-desc">Meta description</label>
                                        <textarea
                                            id="cat-meta-desc"
                                            value={form.meta_description}
                                            onChange={(e) => set('meta_description', e.target.value)}
                                            rows={2}
                                            maxLength={500}
                                            className={field}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={label} htmlFor="cat-meta-kw">Meta keywords</label>
                                        <input
                                            id="cat-meta-kw"
                                            value={form.meta_keywords}
                                            onChange={(e) => set('meta_keywords', e.target.value)}
                                            maxLength={255}
                                            placeholder="comma, separated, keywords"
                                            className={field}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                type="submit"
                                disabled={busy}
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                {editId ? 'Update' : 'Create'}
                            </button>
                            <button
                                type="button"
                                onClick={reset}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {filtered.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-14 text-center dark:border-gray-600">
                        <FolderTree className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">
                            {query ? 'No categories match your search' : 'No categories yet'}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {filtered.map(({ cat, depth }) => (
                            <li
                                key={cat.id}
                                style={{ marginLeft: depth * 24 }}
                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {depth > 0 && <span className="text-gray-300">└</span>}
                                        <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                                        <span className="text-xs text-gray-400">{cat.slug}</span>
                                        {!cat.is_active && (
                                            <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-500">inactive</span>
                                        )}
                                        {cat.parent_id && byId.get(cat.parent_id) && (
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                                in {byId.get(cat.parent_id)?.name}
                                            </span>
                                        )}
                                        {(cat.meta_title || cat.meta_description) && (
                                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-600">seo</span>
                                        )}
                                    </div>
                                    {cat.description && (
                                        <p className="mt-0.5 truncate text-xs text-gray-400">{cat.description}</p>
                                    )}
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <button
                                        onClick={() => startEdit(cat)}
                                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700"
                                        aria-label={`Edit ${cat.name}`}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteFor(cat)}
                                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                                        aria-label={`Delete ${cat.name}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <ConfirmDialog
                    open={deleteFor !== null}
                    title="Delete category?"
                    description={deleteFor ? `Delete "${deleteFor.name}"?` : undefined}
                    confirmLabel="Delete"
                    danger
                    onConfirm={() => deleteFor && remove(deleteFor.id)}
                    onCancel={() => setDeleteFor(null)}
                />
            </div>
        </AdminLayout>
    );
}
