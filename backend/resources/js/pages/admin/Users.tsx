import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Users, Shield, Ban, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import { StatusBadge, EmptyState } from '@/components/shared/Ui';
import LoadingState from '@/components/shared/LoadingState';
import Breadcrumb from '@/components/shared/Breadcrumb';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    is_suspended: boolean;
    email_verified_at?: string;
    created_at: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = () => {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        api.get<{ data: User[] }>(`/api/admin/users${params}`)
            .then((res) => setUsers(res.data))
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, [search]);

    const toggleSuspend = async (userId: string, suspend: boolean) => {
        try {
            if (suspend) await api.post(`/api/admin/users/${userId}/suspend`);
            else await api.post(`/api/admin/users/${userId}/unsuspend`);
            fetchUsers();
        } catch {}
    };

    const changeRole = async (userId: string, role: string) => {
        try {
            await api.put(`/api/admin/users/${userId}/role`, { role });
            fetchUsers();
        } catch {}
    };

    return (
        <AppLayout title="Manage Users">
            <Head title="Manage Users" />

            <div className="space-y-6">
                <Breadcrumb items={[{ label: 'Admin' }, { label: 'Users' }]} />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Users</h1>

                <div className="max-w-md">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
                </div>

                <DataTable
                    loading={loading}
                    emptyTitle="No users found"
                    emptyDescription="Try adjusting your search."
                    columns={[
                        { key: 'user', header: 'User', render: (u: User) => <div><p className="font-medium text-gray-900 dark:text-white">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div> },
                        { key: 'role', header: 'Role', render: (u: User) => <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="rounded border px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700"><option value="customer">Customer</option><option value="vendor">Vendor</option><option value="rider">Rider</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select> },
                        { key: 'status', header: 'Status', render: (u: User) => <StatusBadge status={u.is_suspended ? 'Suspended' : 'Active'} tone={u.is_suspended ? 'red' : 'green'} /> },
                        { key: 'joined', header: 'Joined', render: (u: User) => <span className="text-xs text-gray-500">{formatDateTime(u.created_at)}</span> },
                        { key: 'actions', header: 'Actions', render: (u: User) => <button onClick={() => toggleSuspend(u.id, !u.is_suspended)} className={`text-xs font-medium ${u.is_suspended ? 'text-green-600' : 'text-red-600'}`}>{u.is_suspended ? 'Unsuspend' : 'Suspend'}</button> },
                    ]}
                    data={users}
                />
            </div>
        </AppLayout>
    );
}
