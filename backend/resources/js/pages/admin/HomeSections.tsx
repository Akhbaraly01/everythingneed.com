import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import ConfirmDialog from '@/components/shared/Ui';
import { ArrowUp, ArrowDown, LayoutList, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** home_page_sections row (AdminHomeSectionController). */
interface HomeSection {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    order: number;
}

export default function AdminHomeSections() {
    const { auth } = usePage().props as unknown as { auth: { roles?: string[] } };
    const isSuper = (auth?.roles ?? []).includes('super_admin');

    const [sections, setSections] = useState<HomeSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [deleteFor, setDeleteFor] = useState<HomeSection | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = () => {
        setLoading(true);
        api.get<{ data: HomeSection[] }>('/api/admin/home-sections')
            .then((res) => setSections(rows<HomeSection>(res)))
            .catch((e) => {
                setSections([]);
                toast.error(errorMessage(e, 'Failed to load home sections'));
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const move = async (index: number, direction: -1 | 1) => {
        const next = [...sections];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setSections(next);
        setSaving(true);
        try {
            const res = await api.put<{ data: HomeSection[] }>('/api/admin/home-sections/reorder', {
                order: next.map((s) => s.id),
            });
            setSections(rows<HomeSection>(res));
            toast.success('Section order updated');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not save order'));
            load();
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (section: HomeSection) => {
        setSaving(true);
        try {
            await api.put(`/api/admin/home-sections/${section.id}`, {
                is_active: !section.is_active,
            });
            setSections((prev) =>
                prev.map((s) => (s.id === section.id ? { ...s, is_active: !s.is_active } : s)),
            );
            toast.success(section.is_active ? 'Section disabled' : 'Section enabled');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not update section'));
        } finally {
            setSaving(false);
        }
    };

    const create = async () => {
        if (!name.trim() || !slug.trim()) {
            toast.error('Name and slug are required');
            return;
        }
        setSaving(true);
        try {
            await api.post('/api/admin/home-sections', {
                name: name.trim(),
                slug: slug.trim().toLowerCase(),
            });
            setName('');
            setSlug('');
            toast.success('Section created');
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not create section'));
        } finally {
            setSaving(false);
        }
    };

    const destroy = async (section: HomeSection) => {
        setDeleting(true);
        try {
            await api.del(`/api/admin/home-sections/${section.id}`);
            toast.success('Section deleted');
            setDeleteFor(null);
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete section'));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AdminLayout title="Home Sections">
            <Head title="Home Sections" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <LayoutList className="h-6 w-6" /> Home Page Sections
                    </h1>
                    <span className="text-sm text-gray-500">
                        {sections.filter((s) => s.is_active).length} of {sections.length} visible
                    </span>
                </div>

                <p className="text-sm text-gray-500">
                    Order and visibility drive the storefront scroll sequence. Reorder and
                    enable/disable apply immediately; creating and deleting sections is
                    Super Admin only.
                </p>

                {isSuper && (
                    <div className="rounded-xl border border-border bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold text-foreground">New section</h2>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Name (e.g. Event Planning)"
                                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                            />
                            <input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                placeholder="slug (e.g. event-planning)"
                                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => void create()}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" /> Create
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Slugs map to storefront builders; unknown slugs render nothing until wired.
                        </p>
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    {loading ? (
                        <p className="p-6 text-sm text-gray-500">Loading…</p>
                    ) : sections.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="font-medium text-gray-900 dark:text-white">No sections yet</p>
                            <p className="text-sm text-gray-500">Seed the defaults or create one above.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {sections.map((section, index) => (
                                <li
                                    key={section.id}
                                    data-testid={`home-admin-section-${section.slug}`}
                                    className="flex items-center gap-3 p-4"
                                >
                                    <span className="w-8 shrink-0 text-center text-sm font-bold text-gray-400">
                                        {index + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-gray-900 dark:text-white">
                                            {section.name}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">/{section.slug}</p>
                                    </div>
                                    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-gray-500">
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={section.is_active}
                                            aria-label={`Toggle ${section.name}`}
                                            data-testid={`home-admin-toggle-${section.slug}`}
                                            onClick={() => void toggle(section)}
                                            disabled={saving}
                                            className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                                                section.is_active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                                                    section.is_active ? 'left-[22px]' : 'left-0.5'
                                                }`}
                                            />
                                        </button>
                                        {section.is_active ? 'On' : 'Off'}
                                    </label>
                                    <div className="flex shrink-0 gap-1">
                                        <button
                                            type="button"
                                            aria-label={`Move ${section.name} up`}
                                            onClick={() => void move(index, -1)}
                                            disabled={saving || index === 0}
                                            className="rounded-md border border-border p-1.5 disabled:opacity-40"
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={`Move ${section.name} down`}
                                            onClick={() => void move(index, 1)}
                                            disabled={saving || index === sections.length - 1}
                                            className="rounded-md border border-border p-1.5 disabled:opacity-40"
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </button>
                                        {isSuper && (
                                            <button
                                                type="button"
                                                aria-label={`Delete ${section.name}`}
                                                onClick={() => setDeleteFor(section)}
                                                disabled={saving}
                                                className="rounded-md border border-destructive/40 p-1.5 text-destructive disabled:opacity-40"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <ConfirmDialog
                    open={deleteFor !== null}
                    title="Delete section?"
                    description={deleteFor ? `Delete the "${deleteFor.name}" section from the home page?` : undefined}
                    confirmLabel="Delete"
                    danger
                    busy={deleting}
                    onConfirm={() => deleteFor && void destroy(deleteFor)}
                    onCancel={() => setDeleteFor(null)}
                />
            </div>
        </AdminLayout>
    );
}
