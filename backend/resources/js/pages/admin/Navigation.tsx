import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/Ui';

interface NavItem {
    id: string;
    title: string;
    url: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
}

interface Navigation {
    id: string;
    name: string;
    location: string;
    status: string;
    items?: NavItem[];
}

const LOCATIONS = ['header', 'footer', 'mobile', 'category', 'more'];

/**
 * Plan G4: no-code navigation menu manager. Menus per location with
 * editable items (title/url/icon/order/active), published live to the
 * siteNav shared prop. Previously API-only.
 */
export default function AdminNavigation() {
    const [menus, setMenus] = useState<Navigation[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<NavItem[]>([]);
    const [newMenu, setNewMenu] = useState({ name: '', location: 'header' });
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const selected = menus.find((m) => m.id === selectedId) ?? null;

    const load = () => {
        setLoading(true);
        api.get<{ data: Navigation[] }>('/api/admin/navigations')
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                setMenus(list);
                if (!selectedId && list.length > 0) {
                    setSelectedId(list[0].id);
                    setDraft(list[0].items ?? []);
                } else if (selectedId) {
                    const current = list.find((m) => m.id === selectedId);
                    setDraft(current?.items ?? []);
                }
            })
            .catch((e) => toast.error(errorMessage(e, 'Failed to load menus')))
            .finally(() => setLoading(false));
    };

    useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

    const pick = (id: string) => {
        setSelectedId(id);
        setDraft(menus.find((m) => m.id === id)?.items ?? []);
    };

    const createMenu = async () => {
        if (!newMenu.name.trim()) {
            toast.error('Give the menu a name.');
            return;
        }
        try {
            const res = await api.post<{ data: Navigation }>('/api/admin/navigations', {
                ...newMenu,
                status: 'draft',
            });
            toast.success('Menu created.');
            setNewMenu({ name: '', location: 'header' });
            await reload(res.data.id);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not create menu'));
        }
    };

    const reload = async (selectId?: string) => {
        try {
            const res = await api.get<{ data: Navigation[] }>('/api/admin/navigations');
            const list = Array.isArray(res.data) ? res.data : [];
            setMenus(list);
            const target = selectId ?? selectedId ?? list[0]?.id ?? '';
            setSelectedId(target);
            setDraft(list.find((m) => m.id === target)?.items ?? []);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to reload menus'));
        }
    };

    const publishToggle = async () => {
        if (!selected) return;
        const next = selected.status === 'published' ? 'draft' : 'published';
        try {
            await api.put(`/api/admin/navigations/${selected.id}`, { status: next });
            toast.success(next === 'published' ? 'Menu published live.' : 'Menu set to draft.');
            await reload();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not update menu'));
        }
    };

    const deleteMenu = async () => {
        if (!selected) return;
        setDeleting(true);
        try {
            await api.del(`/api/admin/navigations/${selected.id}`);
            toast.success('Menu deleted.');
            setConfirmDelete(false);
            setSelectedId('');
            setDraft([]);
            await reload();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete menu'));
        } finally {
            setDeleting(false);
        }
    };

    const patchItem = (id: string, patch: Partial<NavItem>) => {
        setDraft((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    };

    const addItem = () => {
        setDraft((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                title: 'New link',
                url: '/',
                icon: '',
                sort_order: prev.length,
                is_active: true,
            },
        ]);
    };

    const removeItem = (id: string) => {
        setDraft((prev) => prev.filter((it) => it.id !== id));
    };

    const saveItems = async () => {
        if (!selected) return;
        for (const it of draft) {
            if (!it.title.trim() || !(it.url ?? '').trim()) {
                toast.error('Every item needs a title and a URL.');
                return;
            }
        }
        setSaving(true);
        try {
            await api.put(`/api/admin/navigations/${selected.id}/items`, {
                items: draft.map((it, i) => ({
                    id: it.id,
                    title: it.title.trim(),
                    url: it.url.trim(),
                    icon: it.icon?.trim() || null,
                    sort_order: i,
                    is_active: it.is_active,
                })),
            });
            toast.success('Menu items saved and live.');
            await reload();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not save items'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout title="Navigation Menus">
            <Head title="Navigation Menus" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Navigation Menus</h1>
                        <p className="text-sm text-gray-500">Header, footer, mobile, category and more menus - published live, no code.</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={newMenu.name}
                            onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                            placeholder="Menu name"
                            aria-label="Menu name"
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <select
                            value={newMenu.location}
                            onChange={(e) => setNewMenu({ ...newMenu, location: e.target.value })}
                            aria-label="Menu location"
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            {LOCATIONS.map((loc) => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => void createMenu()}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                        >
                            <Plus className="h-4 w-4" /> New menu
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : menus.length === 0 ? (
                    <p className="rounded-lg bg-white p-8 text-center text-sm text-gray-500 shadow dark:bg-gray-800">
                        No menus yet. Create one above - e.g. header, footer or mobile.
                    </p>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                        <div className="space-y-2">
                            {menus.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => pick(m.id)}
                                    className={`block w-full rounded-lg border p-3 text-left ${
                                        m.id === selectedId
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                    }`}
                                >
                                    <span className="block text-sm font-medium text-gray-900 dark:text-white">{m.name}</span>
                                    <span className="text-xs text-gray-500">
                                        {m.location} · {m.status} · {(m.items ?? []).length} items
                                    </span>
                                </button>
                            ))}
                        </div>

                        {selected && (
                            <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h2 className="font-semibold text-gray-900 dark:text-white">
                                        {selected.name} <span className="text-sm font-normal text-gray-500">({selected.location})</span>
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void publishToggle()}
                                            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 dark:border-gray-600"
                                        >
                                            {selected.status === 'published' ? 'Set to draft' : 'Publish'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDelete(true)}
                                            className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {draft.map((it) => (
                                        <div key={it.id} className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_1fr_auto] dark:border-gray-700">
                                            <input
                                                value={it.title}
                                                onChange={(e) => patchItem(it.id, { title: e.target.value })}
                                                placeholder="Title"
                                                aria-label="Item title"
                                                maxLength={160}
                                                className="rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                            <input
                                                value={it.url}
                                                onChange={(e) => patchItem(it.id, { url: e.target.value })}
                                                placeholder="/path or https://..."
                                                aria-label="Item URL"
                                                maxLength={500}
                                                className="rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={it.icon}
                                                    onChange={(e) => patchItem(it.id, { icon: e.target.value })}
                                                    placeholder="icon"
                                                    aria-label="Item icon"
                                                    maxLength={80}
                                                    className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                />
                                                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={it.is_active}
                                                        onChange={(e) => patchItem(it.id, { is_active: e.target.checked })}
                                                    />
                                                    On
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(it.id)}
                                                    aria-label={`Remove ${it.title}`}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600"
                                    >
                                        <Plus className="h-4 w-4" /> Add item
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void saveItems()}
                                        disabled={saving}
                                        className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save items'}
                                    </button>
                                </div>

                                <ConfirmDialog
                                    open={confirmDelete}
                                    title={`Delete menu "${selected?.name ?? ''}"?`}
                                    description="The menu and all its items are removed permanently."
                                    confirmLabel="Delete menu"
                                    danger
                                    busy={deleting}
                                    onConfirm={() => void deleteMenu()}
                                    onCancel={() => setConfirmDelete(false)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
