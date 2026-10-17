import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { prepareForUpload } from '@/lib/media-compress';
import ConfirmDialog from '@/components/shared/Ui';
import PageBuilder from '@/components/cms/PageBuilder';
import { FileText, Megaphone, Image as ImageIcon, Plus, Trash2, Newspaper, Pencil, Search, LayoutGrid } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface CmsRow {
    id: string;
    title: string;
    slug?: string;
    content?: string | null;
    description?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    seo_image?: string | null;
    canonical_url?: string | null;
    visibility?: string | null;
    template?: string | null;
    menu_placement?: string | null;
    status?: string;
    position?: string;
    image_url?: string | null;
    link_url?: string | null;
    sort_order?: number;
    is_active?: boolean;
    priority?: string;
    starts_at?: string | null;
    ends_at?: string | null;
    published_at?: string | null;
    updated_at?: string;
}

type Tab = 'pages' | 'blog' | 'banners' | 'announcements';

const TABS: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: 'pages', label: 'Pages', icon: FileText },
    { key: 'blog', label: 'Blog', icon: Newspaper },
    { key: 'banners', label: 'Banners', icon: ImageIcon },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
];

const ENDPOINT: Record<Tab, string> = {
    pages: '/api/admin/cms/pages',
    blog: '/api/admin/cms/blog',
    banners: '/api/admin/cms/banners',
    announcements: '/api/admin/cms/announcements',
};

const BANNER_POSITIONS = ['homepage', 'category', 'footer', 'sidebar', 'checkout'];

interface FormState {
    title: string;
    slug: string;
    content: string;
    description: string;
    seo_title: string;
    seo_description: string;
    seo_image: string;
    canonical_url: string;
    visibility: string;
    template: string;
    menu_placement: string;
    status: string;
    image_url: string;
    link_url: string;
    sort_order: number;
    priority: string;
    position: string;
    is_active: boolean;
    starts_at: string;
    ends_at: string;
}

const emptyForm = (): FormState => ({
    title: '',
    slug: '',
    content: '',
    description: '',
    seo_title: '',
    seo_description: '',
    seo_image: '',
    canonical_url: '',
    visibility: 'public',
    template: 'default',
    menu_placement: 'none',
    status: 'draft',
    image_url: '',
    link_url: '',
    sort_order: 0,
    priority: 'medium',
    position: 'homepage',
    is_active: true,
    starts_at: '',
    ends_at: '',
});

/** API timestamps (ISO or "Y-m-d H:i:s") → datetime-local input value. */
const toLocalInput = (value?: string | null): string => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatWindow = (row: CmsRow): string => {
    if (!row.starts_at && !row.ends_at) return 'always';
    const start = row.starts_at ? toLocalInput(row.starts_at).replace('T', ' ') : '…';
    const end = row.ends_at ? toLocalInput(row.ends_at).replace('T', ' ') : '…';
    return `${start} → ${end}`;
};

export default function AdminCms() {
    const [rows, setRows] = useState<CmsRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('pages');
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CmsRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [builderTarget, setBuilderTarget] = useState<CmsRow | null>(null);
    const [query, setQuery] = useState('');
    const [form, setForm] = useState<FormState>(emptyForm());

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        api.get<{ data: CmsRow[] }>(ENDPOINT[tab])
            .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
            .catch(() => {
                setRows([]);
                setError('Failed to load content');
            })
            .finally(() => setLoading(false));
    }, [tab]);

    useEffect(() => {
        load();
        setQuery('');
        setShowForm(false);
        setEditingId(null);
        setBuilderTarget(null);
    }, [load]);

    const openCreate = () => {
        setForm(emptyForm());
        setEditingId(null);
        setShowForm(true);
        setError(null);
    };

    const openEdit = (row: CmsRow) => {
        setForm({
            title: row.title ?? '',
            slug: row.slug ?? '',
            content: row.content ?? '',
            description: row.description ?? '',
            seo_title: row.seo_title ?? '',
            seo_description: row.seo_description ?? '',
            seo_image: row.seo_image ?? '',
            canonical_url: row.canonical_url ?? '',
            visibility: row.visibility ?? 'public',
            template: row.template ?? 'default',
            menu_placement: row.menu_placement ?? 'none',
            status: row.status ?? 'draft',
            image_url: row.image_url ?? '',
            link_url: row.link_url ?? '',
            sort_order: row.sort_order ?? 0,
            priority: row.priority ?? 'medium',
            position: row.position ?? 'homepage',
            is_active: row.is_active ?? true,
            starts_at: toLocalInput(row.starts_at),
            ends_at: toLocalInput(row.ends_at),
        });
        setEditingId(row.id);
        setShowForm(true);
        setError(null);
    };

    const buildPayload = (): Record<string, unknown> => {
        const payload: Record<string, unknown> = { title: form.title.trim() };
        if (tab === 'pages' || tab === 'blog') {
            payload.content = form.content;
            payload.status = form.status;
            if (tab === 'pages') {
                payload.slug = form.slug.trim() || null;
                payload.description = form.description;
                payload.seo_title = form.seo_title;
                payload.seo_description = form.seo_description;
                payload.seo_image = form.seo_image;
                payload.canonical_url = form.canonical_url;
                payload.visibility = form.visibility;
                payload.template = form.template;
                payload.menu_placement = form.menu_placement;
            }
        } else if (tab === 'banners') {            payload.position = form.position;
            payload.image_url = form.image_url || null;
            payload.link_url = form.link_url || null;
            payload.sort_order = Number(form.sort_order) || 0;
            payload.is_active = form.is_active;
        } else {
            payload.content = form.content;
            payload.priority = form.priority;
            payload.is_active = form.is_active;
            payload.starts_at = form.starts_at || null;
            payload.ends_at = form.ends_at || null;
        }
        return payload;
    };

    const save = async () => {
        if (!form.title.trim()) return;
        try {
            if (editingId) {
                await api.put(`${ENDPOINT[tab]}/${editingId}`, buildPayload());
            } else {
                await api.post(ENDPOINT[tab], buildPayload());
            }
            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm());
            load();
        } catch (e) {
            setError(errorMessage(e, editingId ? 'Update failed' : 'Create failed'));
        }
    };

    const [uploading, setUploading] = useState(false);

    const uploadImageField = async (field: 'image_url' | 'seo_image', file: File) => {
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const prepared = await prepareForUpload(file);
            const fd = new FormData();
            fd.append('file', prepared.file);
            const res = await api.post<{ data: { url: string } }>('/api/upload', fd);
            setForm((f) => ({ ...f, [field]: res.data.url }));
        } catch (e) {
            setError(errorMessage(e, 'Upload failed'));
        } finally {
            setUploading(false);
        }
    };

    const toggleStatus = async (row: CmsRow) => {
        try {
            if (tab === 'pages' || tab === 'blog') {
                await api.put(`${ENDPOINT[tab]}/${row.id}`, {
                    status: row.status === 'published' ? 'draft' : 'published',
                });
            } else {
                await api.put(`${ENDPOINT[tab]}/${row.id}`, { is_active: !row.is_active });
            }
            load();
        } catch (e) {
            setError(errorMessage(e, 'Update failed'));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.del(`${ENDPOINT[tab]}/${deleteTarget.id}`);
            setDeleteTarget(null);
            load();
        } catch (e) {
            setError(errorMessage(e, 'Delete failed'));
        } finally {
            setDeleting(false);
        }
    };

    const statusLabel = (row: CmsRow) => {
        if (tab === 'pages' || tab === 'blog') return row.status || 'draft';
        return row.is_active ? 'active' : 'inactive';
    };

    const isPublished = (row: CmsRow) =>
        tab === 'pages' || tab === 'blog' ? row.status === 'published' : Boolean(row.is_active);

    const q = query.trim().toLowerCase();
    const filtered = q
        ? rows.filter((r) => r.title.toLowerCase().includes(q) || (r.slug ?? '').toLowerCase().includes(q))
        : rows;

    const positions = BANNER_POSITIONS.includes(form.position)
        ? BANNER_POSITIONS
        : [form.position, ...BANNER_POSITIONS];

    return (
        <AdminLayout title="Content Manager">
            <Head title="Content Manager" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Manager</h1>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" /> New {tab.replace(/s$/, '')}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                                tab === key
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            <Icon className="h-4 w-4" /> {label}
                        </button>
                    ))}
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                {showForm ? (
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                            {editingId ? `Edit ${tab.replace(/s$/, '')}` : `New ${tab.replace(/s$/, '')}`}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <input
                                aria-label="Title"
                                className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                placeholder="Title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                            {(tab === 'pages' || tab === 'blog') && (
                                <select
                                    aria-label="Status"
                                    className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            )}
                            {tab === 'pages' && (
                                <>
                                    <input
                                        aria-label="Slug"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        placeholder="slug (auto from title when empty)"
                                        value={form.slug}
                                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                    />
                                    <input
                                        aria-label="Canonical URL"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        placeholder="Canonical URL (optional)"
                                        value={form.canonical_url}
                                        onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                                    />
                                    <input
                                        aria-label="SEO title"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        placeholder="SEO title (falls back to title)"
                                        value={form.seo_title}
                                        onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                                    />
                                    <input
                                        aria-label="SEO description"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        placeholder="SEO description (max 320)"
                                        maxLength={320}
                                        value={form.seo_description}
                                        onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            aria-label="SEO image"
                                            className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                            placeholder="SEO image URL"
                                            value={form.seo_image}
                                            onChange={(e) => setForm({ ...form, seo_image: e.target.value })}
                                        />
                                        <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border border-dashed border-gray-300 px-2 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                            <ImageIcon className="h-4 w-4" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={uploading}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) void uploadImageField('seo_image', file);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <select
                                        aria-label="Visibility"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        value={form.visibility}
                                        onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                                    >
                                        <option value="public">Public</option>
                                        <option value="unlisted">Unlisted</option>
                                    </select>
                                    <select
                                        aria-label="Menu placement"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        value={form.menu_placement}
                                        onChange={(e) => setForm({ ...form, menu_placement: e.target.value })}
                                    >
                                        <option value="none">No menu link</option>
                                        <option value="header">Header menu</option>
                                        <option value="footer">Footer menu</option>
                                        <option value="both">Header + footer</option>
                                    </select>
                                    <input
                                        aria-label="Template"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        placeholder="Template (default)"
                                        value={form.template}
                                        onChange={(e) => setForm({ ...form, template: e.target.value })}
                                    />
                                    <textarea
                                        aria-label="Description"
                                        className="rounded border px-3 py-2 text-sm md:col-span-2 dark:border-gray-600 dark:bg-gray-900"
                                        placeholder="Page description (used as fallback meta description)"
                                        rows={2}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </>
                            )}
                            {tab === 'banners' && (
                                <>
                                    <input
                                        aria-label="Image URL"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        placeholder="Image URL"
                                        value={form.image_url}
                                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                                    />
                                    <div className="flex items-center gap-3 md:col-span-2">
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                            <ImageIcon className="h-4 w-4" />
                                            {uploading ? 'Uploading...' : 'Upload image'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={uploading}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) void uploadImageField('image_url', file);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                        {form.image_url && (
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={form.image_url}
                                                    alt="Banner preview"
                                                    className="h-10 w-20 rounded border border-gray-200 object-cover dark:border-gray-700"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, image_url: '' })}
                                                    className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    aria-label="Remove image"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        aria-label="Link URL"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        placeholder="Link URL"
                                        value={form.link_url}
                                        onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                                    />
                                    <select
                                        aria-label="Position"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        value={form.position}
                                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                                    >
                                        {positions.map((pos) => (
                                            <option key={pos} value={pos}>{pos}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        aria-label="Sort order"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        placeholder="Sort order"
                                        value={form.sort_order}
                                        onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                                    />
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                        />
                                        Active (shown on storefront)
                                    </label>
                                </>
                            )}
                            {tab === 'announcements' && (
                                <>
                                    <select
                                        aria-label="Priority"
                                        className="rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                        />
                                        Active
                                    </label>
                                    <div>
                                        <label htmlFor="ann-starts" className="mb-1 block text-xs text-gray-500">Starts at</label>
                                        <input
                                            id="ann-starts"
                                            type="datetime-local"
                                            className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                            value={form.starts_at}
                                            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="ann-ends" className="mb-1 block text-xs text-gray-500">Ends at</label>
                                        <input
                                            id="ann-ends"
                                            type="datetime-local"
                                            className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                            value={form.ends_at}
                                            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                            {(tab === 'pages' || tab === 'blog' || tab === 'announcements') && (
                                <textarea
                                    className="rounded border px-3 py-2 text-sm md:col-span-2 dark:border-gray-600 dark:bg-gray-900"
                                    placeholder="Content"
                                    rows={3}
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                />
                            )}
                            {(tab === 'pages' || tab === 'blog') && editingId && (
                                <p className="text-xs text-gray-500 md:col-span-2">
                                    Leave the slug empty to regenerate it from the title.
                                </p>
                            )}
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => void save()} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">
                                {editingId ? 'Save changes' : 'Create'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                }}
                                className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : null}

                {!loading && rows.length > 0 && (
                    <div className="relative max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            aria-label={`Search ${tab}`}
                            placeholder={`Search ${tab}...`}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                )}

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : filtered.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">{rows.length === 0 ? `No ${tab} found` : 'No matches'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Title</th>
                                    {tab !== 'banners' && tab !== 'announcements' && (
                                        <th className="px-4 py-3">Slug</th>
                                    )}
                                    {tab === 'banners' && <th className="px-4 py-3">Link</th>}
                                    {tab === 'announcements' && <th className="px-4 py-3">Window</th>}
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filtered.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            {p.title}
                                        </td>
                                        {tab !== 'banners' && tab !== 'announcements' && (
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                                /{p.slug}
                                            </td>
                                        )}
                                        {tab === 'banners' && (
                                            <td className="px-4 py-3 text-xs text-gray-500">{p.link_url || '—'}</td>
                                        )}
                                        {tab === 'announcements' && (
                                            <td className="px-4 py-3 text-xs text-gray-500">{formatWindow(p)}</td>
                                        )}
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => void toggleStatus(p)}
                                                aria-label={`Toggle status for ${p.title}`}
                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    isPublished(p)
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                            >
                                                {statusLabel(p)}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="text-indigo-600 hover:text-indigo-800"
                                                    aria-label={`Edit ${p.title}`}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                {tab === 'pages' && (
                                                    <button
                                                        onClick={() => setBuilderTarget(p)}
                                                        className="inline-flex items-center gap-1 rounded border border-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:hover:bg-indigo-950"
                                                        aria-label={`Edit blocks for ${p.title}`}
                                                    >
                                                        <LayoutGrid className="h-3.5 w-3.5" /> Blocks
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteTarget(p)}
                                                    className="text-red-500 hover:text-red-700"
                                                    aria-label={`Delete ${p.title}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                title={`Delete ${deleteTarget?.title ?? tab.replace(/s$/, '')}?`}
                description="The row is soft-deleted and hidden from the admin list and public endpoints."
                confirmLabel="Delete"
                danger
                busy={deleting}
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeleteTarget(null)}
            />

            {builderTarget && (
                <PageBuilder
                    page={{ id: builderTarget.id, title: builderTarget.title, slug: builderTarget.slug ?? '' }}
                    onClose={() => setBuilderTarget(null)}
                    onSaved={load}
                />
            )}
        </AdminLayout>
    );
}
