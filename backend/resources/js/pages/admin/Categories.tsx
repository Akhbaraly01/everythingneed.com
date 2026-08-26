import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { FolderTree, Plus, Pencil, Trash2 } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    is_active: boolean;
}

interface Props {
    categories: Category[];
}

export default function AdminCategories({ categories }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);

    const reset = () => { setShowForm(false); setEditId(null); setName(''); };

    const startEdit = (cat: Category) => {
        setEditId(cat.id);
        setName(cat.name);
        setShowForm(true);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            if (editId) {
                await api.put(`/api/categories/${editId}`, { name });
                toast.success('Category updated');
            } else {
                await api.post('/api/categories', { name });
                toast.success('Category created');
            }
            reset();
            router.reload({ only: ['categories'] as never });
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Failed');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id: string) => {
        if (!confirm('Delete this category?')) return;
        try {
            await api.delete(`/api/categories/${id}`);
            toast.success('Deleted');
            router.reload({ only: ['categories'] as never });
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Failed');
        }
    };

    return (
        <AppLayout title="Admin · Categories">
            <Head title="Categories" />
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                            <FolderTree className="h-6 w-6 text-purple-600" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
                            <p className="text-sm text-gray-500">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { reset(); setShowForm(!showForm); }}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" /> Add category
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={submit} className="mb-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Category name"
                            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            required
                            autoFocus
                        />
                        <button type="submit" disabled={busy} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                            {editId ? 'Update' : 'Create'}
                        </button>
                        <button type="button" onClick={reset} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400">
                            Cancel
                        </button>
                    </form>
                )}

                {categories.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-14 text-center dark:border-gray-600">
                        <FolderTree className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">No categories yet</p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {categories.map((cat) => (
                            <li key={cat.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                                    <span className="ml-2 text-xs text-gray-400">{cat.slug}</span>
                                    {!cat.is_active && <span className="ml-2 text-xs text-red-500">(inactive)</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => startEdit(cat)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700">
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => remove(cat.id)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
