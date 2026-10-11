import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { api, errorMessage } from '@/lib/api';
import ConfirmDialog from '@/components/shared/Ui';
import DataTable from '@/components/shared/DataTable';
import { toast } from 'sonner';
import { Building2, Plus, Pencil, Trash2, X } from 'lucide-react';

interface Department {
    id: string;
    name: string;
    description?: string | null;
    created_at: string;
    tickets_count: number;
}

interface Props {
    departments: Department[];
}

const emptyForm = { name: '', description: '' };

export default function AdminDepartments({ departments }: Props) {
    const [editing, setEditing] = useState<Department | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [busy, setBusy] = useState(false);
    const [deleteFor, setDeleteFor] = useState<Department | null>(null);

    const openCreate = () => { setForm(emptyForm); setEditing(null); setCreating(true); };
    const openEdit = (d: Department) => {
        setForm({ name: d.name, description: d.description ?? '' });
        setEditing(d);
        setCreating(true);
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            if (editing) {
                await api.put(`/api/admin/departments/${editing.id}`, form);
                toast.success('Department updated');
            } else {
                await api.post('/api/admin/departments', form);
                toast.success('Department created');
            }
            setCreating(false);
            router.reload({ only: ['departments'] });
        } catch (err) {
            toast.error(errorMessage(err, 'Save failed'));
        } finally {
            setBusy(false);
        }
    };

    const destroy = async (d: Department) => {
        try {
            await api.del(`/api/admin/departments/${d.id}`);
            toast.success('Department deleted');
            router.reload({ only: ['departments'] });
        } catch (err) {
            toast.error(errorMessage(err, 'Delete failed'));
        } finally {
            setDeleteFor(null);
        }
    };

    return (
        <AdminLayout title="Admin · Departments">
            <Head title="Departments" />
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100"><Building2 className="h-6 w-6 text-sky-600" /></span>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
                            <p className="text-sm text-gray-500">Routing for support tickets and internal escalation</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
                        <Plus className="h-4 w-4" /> New department
                    </button>
                </div>

                <DataTable
                    columns={[
                        { key: 'name', header: 'Name', accessor: 'name', sortable: true },
                        {
                            key: 'description', header: 'Description',
                            render: (d) => <span className="text-gray-500">{d.description ?? '—'}</span>,
                        },
                        { key: 'tickets', header: 'Tickets', accessor: 'tickets_count', sortable: true },
                        {
                            key: 'actions', header: 'Actions',
                            render: (d) => (
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => openEdit(d)} className="text-gray-400 hover:text-sky-600"><Pencil className="h-4 w-4" /></button>
                                    <button
                                        onClick={() => setDeleteFor(d)}
                                        disabled={Number(d.tickets_count) > 0}
                                        title={Number(d.tickets_count) > 0 ? 'In use by tickets — cannot delete' : 'Delete'}
                                        className="text-gray-400 hover:text-red-500 disabled:cursor-not-allowed disabled:text-gray-200"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    data={departments}
                    emptyTitle="No departments yet"
                    emptyDescription="Create the first routing department."
                />

                {/* Modal */}
                {creating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setCreating(false)} />
                        <form onSubmit={save} className="relative w-full max-w-md space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-gray-900 dark:text-white">{editing ? 'Edit department' : 'New department'}</h2>
                                <button type="button" onClick={() => setCreating(false)}><X className="h-5 w-5 text-gray-400" /></button>
                            </div>
                            <input
                                required
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Department name (e.g. Billing)"
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="What kinds of issues route here?"
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setCreating(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" disabled={busy} className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60">
                                    {busy ? 'Savingâ€¦' : editing ? 'Save changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <ConfirmDialog
                    open={deleteFor !== null}
                    title="Delete department?"
                    description={deleteFor ? `Delete department "${deleteFor.name}"?` : undefined}
                    confirmLabel="Delete"
                    danger
                    onConfirm={() => deleteFor && destroy(deleteFor)}
                    onCancel={() => setDeleteFor(null)}
                />
            </div>
        </AdminLayout>
    );
}
