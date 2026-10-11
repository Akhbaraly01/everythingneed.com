import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import ConfirmDialog from '@/components/shared/Ui';
import DataTable from '@/components/shared/DataTable';
import Image from '@/components/shared/Image';
import MediaPicker from '@/components/shared/MediaPicker';
import { useResourceList } from '@/lib/useResourceList';
import { Plus, Pencil, Trash2, Search, ImagePlus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

/** Real brands row (AdminBrandController). */
interface Brand {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    is_active: boolean;
    created_at: string;
}

export default function AdminBrands() {
    const { items: brands, setItems: setBrands, meta, loading, search, setSearch, submitSearch, page, setPage, reload: load } =
        useResourceList<Brand>('/api/admin/brands');

    const [showForm, setShowForm] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [deleteFor, setDeleteFor] = useState<Brand | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState<Brand | null>(null);
    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
            const payload = { name: name.trim(), logo_url: logoUrl || null, is_active: isActive };
            if (editing) {
                await api.put(`/api/admin/brands/${editing.id}`, payload);
                toast.success('Brand updated.');
            } else {
                await api.post('/api/admin/brands', payload);
                toast.success('Brand created.');
            }
            setShowForm(false);
            setEditing(null);
            resetForm();
            load();
        } catch (err) {
            toast.error(errorMessage(err, 'Saving failed'));
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setName('');
        setLogoUrl('');
        setIsActive(true);
    };

    const startEdit = (b: Brand) => {
        setEditing(b);
        setName(b.name);
        setLogoUrl(b.logo_url ?? '');
        setIsActive(b.is_active);
        setShowForm(true);
    };

    const toggleActive = async (b: Brand) => {
        try {
            await api.put(`/api/admin/brands/${b.id}`, { is_active: !b.is_active });
            setBrands(brands.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)));
            toast.success(`Brand ${!b.is_active ? 'activated' : 'deactivated'}.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        }
    };

    const remove = async (b: Brand) => {
        setDeleting(true);
        try {
            await api.del(`/api/admin/brands/${b.id}`);
            setBrands(brands.filter((x) => x.id !== b.id));
            toast.success('Brand deleted.');
        } catch (e) {
            toast.error(errorMessage(e, 'Delete failed'));
        } finally {
            setDeleting(false);
            setDeleteFor(null);
        }
    };

    return (
        <AdminLayout title="Brands">
            <Head title="Brands" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Brands</h1>
                    <button
                        onClick={() => {
                            setEditing(null);
                            resetForm();
                            setShowForm(!showForm);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                        <Plus className="h-4 w-4" /> New Brand
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Brand' : 'Create Brand'}</h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <label className="text-sm">
                                <span className="mb-1 block text-gray-600 dark:text-gray-400">Name *</span>
                                <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={150}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm">
                                <span className="mb-1 block text-gray-600 dark:text-gray-400">Logo URL</span>
                                <div className="flex items-center gap-2">
                                    {logoUrl && <Image src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />}
                                    <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} maxLength={500} placeholder="/storage/… or https://…"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                    <button type="button" onClick={() => setShowPicker(true)} title="Choose from the media library"
                                        className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                        <ImagePlus className="h-4 w-4" /> Browse
                                    </button>
                                </div>
                            </label>
                            <label className="mt-6 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                                Active
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={saving}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <form onSubmit={(e) => { e.preventDefault(); submitSearch(); }} className="flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brands..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700" />
                    </div>
                    <button type="submit" className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-600">Search</button>
                </form>

                <DataTable
                    columns={[
                        {
                            key: 'name', header: 'Brand', accessor: 'name', sortable: true,
                            render: (b) => (
                                <div className="flex items-center gap-2">
                                    {b.logo_url && <Image src={b.logo_url} alt="" className="h-6 w-6 rounded object-cover" />}
                                    <span className="font-medium text-gray-900 dark:text-white">{b.name}</span>
                                </div>
                            ),
                        },
                        { key: 'slug', header: 'Slug', accessor: 'slug', sortable: true },
                        {
                            key: 'status', header: 'Status',
                            render: (b) => (
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${b.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {b.is_active ? 'Active' : 'Inactive'}
                                </span>
                            ),
                        },
                        {
                            key: 'created', header: 'Created', accessor: 'created_at', sortable: true,
                            render: (b) => <span className="text-xs text-gray-500">{formatDateTime(b.created_at)}</span>,
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (b) => (
                                <div className="flex gap-2">
                                    <button onClick={() => startEdit(b)} title="Edit"
                                        className="rounded p-1 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => toggleActive(b)} title={b.is_active ? 'Deactivate' : 'Activate'}
                                        className="rounded p-1 text-amber-600 hover:bg-amber-50 text-xs font-semibold">{b.is_active ? 'Disable' : 'Enable'}</button>
                                    <button onClick={() => setDeleteFor(b)} title="Delete"
                                        className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ),
                        },
                    ]}
                    data={brands}
                    loading={loading}
                    emptyTitle="No brands found"
                    emptyDescription="Create the first brand to get started."
                />

                <ConfirmDialog
                    open={deleteFor !== null}
                    title="Delete brand?"
                    description={deleteFor ? `Delete brand "${deleteFor.name}"?` : undefined}
                    confirmLabel="Delete"
                    danger
                    busy={deleting}
                    onConfirm={() => deleteFor && remove(deleteFor)}
                    onCancel={() => setDeleteFor(null)}
                />

                <MediaPicker open={showPicker} title="Choose brand logo"
                    onSelect={(url) => { setLogoUrl(url); setShowPicker(false); }}
                    onClose={() => setShowPicker(false)} />

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.current_page} of {meta.last_page} · {meta.total} brands</span>
                        <div className="flex gap-2">
                            <button disabled={meta.current_page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
